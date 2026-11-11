// import { MultiTopicSource } from "multitopic";
import { SingleTypePanelWidgetBase } from "widgets/single-type-widget-base";
import * as THREE from "three";
import { TrackballControls } from "../input/TrackballControls.js";
import { AxesHelper2 } from 'axes-helper2';

export class PointCloudWidget extends SingleTypePanelWidgetBase {
	
	static DEFAULT_WIDTH = 5;
	static DEFAULT_HEIGHT = 12;
	static HANDLED_MSG_TYPES = [ 'sensor_msgs/msg/PointCloud2' ];

    static CAL_ROWS = 8;
    static CAL_LO = 16;
    static CAL_HI = 235;
    static CODE_LO = 24;
    static CODE_HI = 235;
    static CODE_INVALID = 16;

    static VERT = /* glsl */ `
        precision highp float;
        precision highp int;

        uniform sampler2D frameTex;   // the <video>, RGB, nearest-filtered, no colour space decode
        uniform ivec2 cloudSize;      // (W, H)
        uniform vec3  minXYZ;
        uniform vec3  maxXYZ;
        uniform float pointSize;

        out float vT;
        out float vValid;

        float gray(ivec2 p) {
            vec3 c = texelFetch(frameTex, p, 0).rgb;
            return (c.r + c.g + c.b) * (255.0 / 3.0);     // 0..255
        }

        void main() {
            int W = cloudSize.x, H = cloudSize.y;
            ivec2 cell = ivec2(position.xy);                // (col, row) in the W x H grid

            // Calibration: centre of the low and high patches (the band is 8 rows tall;
            // sample the middle row so block edges never matter).
            int calRow = H + ${PointCloudWidget.CAL_ROWS / 2};
            float gLo = gray(ivec2(W / 2,         calRow));
            float gHi = gray(ivec2(2 * W + W / 2, calRow));
            float a = (gHi - gLo) / float(${PointCloudWidget.CAL_HI - PointCloudWidget.CAL_LO});
            float b = gLo - a * float(${PointCloudWidget.CAL_LO});

            // Three luma samples -> codes -> coordinates
            vec3 g = vec3(gray(ivec2(cell.x,         cell.y)),
                          gray(ivec2(cell.x + W,     cell.y)),
                          gray(ivec2(cell.x + 2 * W, cell.y)));
            vec3 code = (g - b) / a;

            bool invalid = any(lessThan(code, vec3(${(PointCloudWidget.CODE_INVALID + PointCloudWidget.CODE_LO) / 2}.0)));
            vec3 q = clamp((code - ${PointCloudWidget.CODE_LO}.0) / ${PointCloudWidget.CODE_HI - PointCloudWidget.CODE_LO}.0, 0.0, 1.0);
            vec3 p = minXYZ + q * (maxXYZ - minXYZ);        // sensor frame (ROS: x fwd, y left, z up)

            vec3 pThree = vec3(-p.y, p.z, -p.x);            // ROS -> three.js (y up)
            vec4 mv = modelViewMatrix * vec4(pThree, 1.0);
            gl_Position = invalid ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
            gl_PointSize = invalid ? 0.0 : clamp(pointSize / max(-mv.z, 0.1), 1.0, 16.0);

            vT = q.z;
            vValid = invalid ? 0.0 : 1.0;
        }
    `;

    static FRAG = /* glsl */ `
        precision highp float;
        in float vT;
        in float vValid;
        out vec4 fragColor;

        vec3 ramp(float t) {
            return clamp(vec3(1.5 * t - 0.5, 1.0 - abs(2.0 * t - 1.0) * 1.2 + 0.2, 1.5 - 1.5 * t), 0.0, 1.0);
        }

        void main() {
            if (vValid < 0.5) discard;
            vec2 d = gl_PointCoord - 0.5;
            if (dot(d, d) > 0.25) discard;
            fragColor = vec4(ramp(vT), 1.0);
        }
    `;

	constructor(panel, topic) {
		super(panel, topic, 'pointcloud');

        // defaults overwritten by url params
        this.vars = {
            camera_lock_horizon: true,
            perspective_camera: true,
        };

        // the muted flag allows video autoplay in chrome before any user interactions
		this.video_el = $('<video id="panel_pointcloud_video_' + panel.n + '" autoplay="true" playsinline="true" muted="true" preload="metadata"></video>');
		this.video_stats_el = $('<span id="pc_video_stats_' + panel.n + '" class="video_stats"></span>');
        this.panel.source_el.empty()
                            .addClass('video')
                            .append([this.video_el, this.video_stats_el]);

		this.last_video_stats_string = "";
		this.last_video_packets_lost = 0;
		this.last_video_frames_dropped = 0;
		this.video_stats_enabled = this.panel.getPanelVarAsBool('st', false);
		this.last_video_freeze_count = 0;

		if (this.video_stats_enabled)
			this.video_stats_el.addClass("enabled");

		this.video_width = -1;
		this.video_height = -1;

		let that = this;

		this.video_el[0].onloadedmetadata = () => {
			if (!that.panel.paused)
				that.video_el[0].play().catch((e) => console.error("Play failed:", e));
		};

		this.video_el[0].addEventListener("resize", () => {
			// Safari sometimes doesn't load meta properly => wait for actual dimensions
			if (that.video_width != -1 || that.video_height != -1) return;

			if (!that.video_el[0].videoWidth || !that.video_el[0].videoHeight) {
				console.log("Invalid video metadata loaded, ignoring; w, h = ", that.video_el[0].videoWidth, that.video_el[0].videoHeight);
				return;
			}

			console.log("Video meta loaded:", that.video_el[0].videoWidth, that.video_el[0].videoHeight);
			that.video_width = that.video_el[0].videoWidth;
			that.video_height = that.video_el[0].videoHeight;
		});

		this.video_el[0].addEventListener("error", (ev) => {
			console.log("(Assigned) Stream error", ev);
		});

        this.onMediaStream = (id_src, stream, mid) => {
            if (id_src != that.topic)
                return;
            that.setVideoStream(that.video_el, stream, mid);
        }
        this.client.on("media_stream", this.onMediaStream);
		this.setVideoStream(this.video_el); // try init

        this.loadPanelConfig();

        [ panel.widget_width, panel.widget_height ] = panel.getAvailableWidgetSize();

        this.scene = new THREE.Scene();
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            precision: "highp", // TODO: med & low are really bad on some devices, there could be a switch for this in the menu
        });
        this.renderer.localClippingEnabled = true;
        this.renderer.info.autoReset = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.setSize(panel.widget_width, panel.widget_height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.widget_el[0].appendChild(this.renderer.domElement);

        this.DEBUG_CAMERA = false;
		this.SHOW_CONTROLS_FOCUS = false;

        this.camera_controls_target = new THREE.Mesh(new THREE.SphereGeometry(0.01, 32, 16), new THREE.MeshBasicMaterial({ color: 0xff00ff }));
        this.camera_controls_target.position.set(0, 0, 0); // adjusted by url
        this.camera_controls_target.visible = this.DEBUG_CAMERA; // enable when debugging
        this.scene.add(this.camera_controls_target);

        this.camera_selection = new THREE.Mesh(new THREE.SphereGeometry(0.01, 32, 16), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
        this.camera_selection.position.set(0, 0, 0); // adjusted by url
        this.camera_selection.visible = this.DEBUG_CAMERA; // enable when debugging
        this.scene.add(this.camera_selection);

        const grid_helper = new THREE.GridHelper(10, 10);
        this.scene.add(grid_helper);
        const axes_helper = new AxesHelper2(5, 2);
		axes_helper.scale.set(1, 1, 1); //show z forward like in ROS
		this.scene.add(axes_helper);

        this.makeCamera();

        this.camera.position.set(1,1,1);

        this.controls = new TrackballControls(this.camera, this.renderer.domElement);
		this.controls.staticMoving = true; // no damping
		this.controls.keys = []; // disable ASD controls

		this.renderer.domElement.addEventListener("pointerdown", (ev) => {
			if (that.ui.space_mouse) {
				that.ui.space_mouse.setWidget(that);
			}
			ev.preventDefault(); // stop from moving the panel
		});
		this.controls.addEventListener("start", () => {
			if (that.SHOW_CONTROLS_FOCUS)
				this.camera_controls_target.visible = true;
		});
		this.controls.addEventListener("change", () => {
			that.controlsChanged();
			//that.controls.update();
		});
		this.controls.addEventListener("end", () => {
			that.storeCameraPosePanelVars(); // saves camera pos in url
			if (that.SHOW_CONTROLS_FOCUS)
				this.camera_controls_target.visible = false;
		});
		this.controls_dirty = false;

		this.controls.target = this.camera_controls_target.position; // panning moves the target
		this.controls.lookTarget = this.camera_controls_target.position;
		this.controls.fixHorizon = this.vars.camera_lock_horizon;
		// if (!this.set_camera_view) {
		// 	this.controls.update();
		// }

        this.light = new THREE.DirectionalLight(0xffffff, 2.0, 0, Math.PI / 10);
        
        this.scene.add(this.light);
        this.light.position.set(10, 15, 0);

        this.light.shadow.bias = -0.0003; // fixes rendering artefacts on double-sided surfaces

        this.ambience = new THREE.AmbientLight(0x606060); // soft white light
        this.scene.add(this.ambience);

		if (this.light)
			this.light.lookAt(this.camera_selection);

        this.ui.space_mouse.setWidget(this);

		
        this.rendering = true;
        this.renderDirty();
        requestAnimationFrame((t) => this.renderingLoop(t));
	}

    renderingLoop(now) {
        if (!this.rendering) {
			requestAnimationFrame((t) => this.renderingLoop(t));
			return;
		}

        let space_mouse_animating = false;
        if (this.ui.space_mouse && this.ui.space_mouse.isControllingWidget(this))
            space_mouse_animating = this.ui.space_mouse.update(now);
        if (!space_mouse_animating)
            this.controls.update();

        if (this.controls_dirty || this.render_dirty) {
			try {

				this.controls_dirty = false;
				this.render_dirty = false;
				this.renderer.render(this.scene, this.camera);
				this.rendering_error_logged = false;
				// this.panel.updateFps();

			} catch (e) {
				if (!this.rendering_error_logged) {
					this.rendering_error_logged = true;
					console.error("Error caught while rendering", e);
					this.scene.traverse(function (obj) {
						// add some debug data
						var s = "";
						var obj2 = obj;
						while (obj2 !== that.scene) {
							s += "-";
							obj2 = obj2.parent;
						}
						console.log(
							s + obj.type + " " + obj.name + " mat: " + obj.material,
						);
					});
				}
			}
		}

		requestAnimationFrame((t) => this.renderingLoop(t));
	}

    renderDirty() {
		if (!this.renderer) return;
		this.render_dirty = true;
	}

    controlsChanged() {
		this.controls_dirty = true;
	}

    storeCameraPosePanelVars() {

    }

    loadPanelConfig() {
        
    }

    makeCamera() {
        let old_camera = this.camera;

        let aspect = this.panel.widget_width / this.panel.widget_height;

        if (this.vars.perspective_camera) {
            this.camera = new THREE.PerspectiveCamera(75, aspect, 0.01, 1000);
        } else {
            const frustumSize = 1.0;
            this.camera = new THREE.OrthographicCamera(
                (frustumSize * aspect) / -2.0,
                (frustumSize * aspect) / 2.0,
                frustumSize / 2.0,
                frustumSize / -2.0,
                -1000, // negative near to prvent clipping while keeping the zoom functionality
                1000,
            );
            if (this.set_ortho_camera_zoom > 0) {
                //set zoom from url
                this.camera.zoom = this.set_ortho_camera_zoom;
                this.set_ortho_camera_zoom = -1;
            }
        }

        this.scene.add(this.camera);
        if (old_camera) {
            let old_type = old_camera.isOrthographicCamera ? "ORTHO" : "PERSP";
            console.log("Old " + old_type + " camera pos was [" + old_camera.position.x + ";" + old_camera.position.y + ";" + old_camera.position.z + "]; zoom " + old_camera.zoom);

            this.camera.position.copy(old_camera.position);
            this.camera.quaternion.copy(old_camera.quaternion);
            this.camera.zoom = 1.0;

            if (this.vars.perspective_camera) {
                if (old_camera.isOrthographicCamera) {
                    // compensate for ortho > persp
                    const targetDistance = this.camera.position.distanceTo(this.camera_controls_target.position);
                    const visibleHeight =
                        (old_camera.top - old_camera.bottom) / old_camera.zoom;
                    const fovRadians = THREE.MathUtils.degToRad(this.camera.fov);
                    const requiredDistance = visibleHeight / 2 / Math.tan(fovRadians / 2);
                    const moveDistance = requiredDistance - targetDistance;
                    const forwardVector = new THREE.Vector3(0, 0, 1).applyQuaternion(
                        this.camera.quaternion,
                    );
                    this.camera.position.add(forwardVector.multiplyScalar(moveDistance));
                }
            } else {
                if (old_camera.isOrthographicCamera) {
                    this.camera.zoom = old_camera.zoom; // keep ortho zoom
                } else {
                    // compensate for perp > ortho
                    const targetDistance = this.camera.position.distanceTo(this.camera_controls_target.position);
                    const fovRadians = THREE.MathUtils.degToRad(old_camera.fov);
                    const visibleHeight = 2 * Math.tan(fovRadians / 2) * targetDistance;

                    // Calculate the zoom factor for the orthographic camera
                    this.camera.zoom = (2 * this.camera.top) / visibleHeight;
                }
            }

            old_camera.removeFromParent();
            this.camera.updateProjectionMatrix();
            this.camera.layers = old_camera.layers;
            this.controls.object = this.camera;
            this.controls.update();
        }
    }

	getFpsString() {
		if (this.video_stats_el && this.video_stats_el.hasClass("enabled"))
			this.video_stats_el.html(this.last_video_stats_string);

		return this.panel.fps.toFixed(0) + " FPS"; // set in ui.updateAllVideoStats
	}

	onPaused() {
		let id_stream = this.client.topic_streams[this.topic];
		if (!id_stream || !this.client.open_media_streams[id_stream]) return;

		console.log("Pausing stream for " + this.topic + "; " + id_stream);
		// this.client.open_media_streams[id_stream].stream.getTracks().forEach((track) => {
		// 	track.enabled = false;
		// });
		this.video_el.prop('autoplay', false);
		this.video_el[0].pause();
	}

	onUnpaused() {
		let id_stream = this.client.topic_streams[this.topic];
		if (!id_stream || !this.client.open_media_streams[id_stream]) return;

		console.log("Unpausing stream for " + this.topic + "; " + id_stream);
		// this.client.open_media_streams[id_stream].stream.getTracks().forEach((track) => {
		// 	track.enabled = true;
		// });
		this.video_el.prop('autoplay', true);
		this.video_el[0].play().catch((e) => console.error("Play failed:", e));
	}

    onResize() {
		if (this.panel.widget_width < 250) {
			$(this.panel.grid_widget).addClass("buttons-hidden");
		} else {
			$(this.panel.grid_widget).removeClass("buttons-hidden");
		}
		this.updateOrthoCameraAspect();
		this.renderDirty();
	}

    updateOrthoCameraAspect() {
		if (this.camera.isOrthographicCamera) {
			const aspect = this.panel.widget_width / this.panel.widget_height;
			const frustumSize = 1.0;
			this.camera.left = (frustumSize * aspect) / -2.0;
			this.camera.right = (frustumSize * aspect) / 2.0;
			this.camera.top = frustumSize / 2.0;
			this.camera.bottom = frustumSize / -2.0;
			this.camera.updateProjectionMatrix();
			this.renderDirty();
		}
	}

    onClose() {
        this.client.off("media_stream", this.onMediaStream);
    }
}
