/**
 * Extend this class to implement a custom single-type topic widget as outlined in the code snippet below.
 * A working example - :doc:`panel displaying Bool messages </remote/bool-example>` - can be found `in the Extras 
 * repository <https://github.com/PhantomCybernetics/phntm_remote_extras/tree/main/examples/custom-bool-panel-widget/>`_
 * and also :doc:`live in our demos </remote/demos/>`. 
 */
export class SingleTypePanelWidgetBase extends EventTarget {

     /**
      * Default panel width in grid columns when created
      * @static
      * @type {number}
      */
    static DEFAULT_WIDTH = 1;
    /**
      * Default panel height in grid rows when created
      * @static
      * @type {number}
      */
	static DEFAULT_HEIGHT = 6;
    /**
     * Topic message types to associate this widget with
     * @static
     * @type {string[]}
     */
    static HANDLED_MSG_TYPES = [ ];

    /**
     * @constructor
     * @param {Panel} panel :js:doc:`Panel` reference
     * @param {string} topic Topic name
     * @param {string} widget_css_class CSS class to use  
     */
    constructor(panel, topic, widget_css_class) {
        super(); // EventTarget

        /**
         * :js:doc:`Panel` reference
         * @type {Panel}
         */
		this.panel = panel; 
        /**
         * :js:doc:`BrowserClient` reference
         * @type {BrowserClient} 
         */
        this.client = panel.ui.client;
        /**
         * :js:doc:`PanelUI` reference
         * @type {PanelUI}
         */
        this.ui = panel.ui; 
        /**
         * Topic name
         * @type {string}
         */
		this.topic = topic;
        /**
         * If true, resize renderer attached to this widget automatically
         * @type {boolean}
         */
        this.autoresize_renderer = true; // if renderer exists, it will be resized before onResize is called
        /**
         * Widget DOM element
         * @type {jQuery}
         */
        this.widget_el = panel.widget_el;
        this.widget_el.addClass("enabled");
        if (widget_css_class)
            this.widget_el.addClass(widget_css_class);
    }

    /**
     * Called when data for the topic is received
     * @param {MsgType} msg 
     */
    onData(msg) {

    }

    /**
     * Called on panel/window resize
     */
    onResize() {

    }

    /**
     * Setup menu items by adding new lines into the provided menu_els container
     * @param {jQuery} menu_els 
     */
    setupMenu(menu_els) {

    }

    /**
     * Called when the panel is paused
     */
    onPaused() {

    }

    /**
     * Called when the panel is unpaused
     */
    onUnpaused() {

    }

    /**
     * Returns string to be displayed in the FPS label
     * @returns {string}
     */
    getFpsString() {
        return ''; // return string to be displayed in the FPS label
    }

    /**
     * Called when the panel is closed
     */
    onClose() {
    }

    setVideoStream(video_el, stream = null, mid=null) {
		if (!stream && !this.id_stream) {
			console.debug("No media stream given, nor set for panel yet");
			return;
		}
		if (stream)
			this.id_stream = stream.id;
		if (mid)
			this.mid = mid; // can't use trackIdentifier bcs Firefox overwrites it

		if (!video_el) {
			console.log('Panel #' + this.panel.n + ' video element not ready yet for panel');
			return;
		}
		if (!stream && this.client.open_media_streams[this.id_stream])
			stream = this.client.open_media_streams[this.id_stream].stream;
		if (!stream) {
			console.error("Stream " + this.id_stream + " not an object", stream);
			return;
		}
		if (!stream.active) {
			console.error("Stream " + this.id_stream + " inactive", stream);
			return;
		}

		let that = this;
		window.setTimeout(() => {
			try {
				// if (video_el[0].srcObject === stream) {
				// 	console.log("Stream identical for " + that.id_stream + ", ignoring", stream);
				// } else {
				// 	console.warn("Assigning stream " + that.id_stream + " to panel", stream);
				// 	console.log("PC iceConnectionState=" + that.ui.client.pc.iceConnectionState + "; video.el readyState=" + video_el[0].readyState);
					video_el[0].srcObject = stream;
				//}
			} catch (e) {
				console.error("Trying to set stream for " + that.id_stream + " threw an exception", e);
			}
		}, 0);
	}

    updateVideoStats(res) {
        if (!this.mid || this.mid != res.mid)
            return;

        let stats_string = "";
        stats_string += `${res.timestamp}<br>`;
        let fps = 0;
        Object.keys(res).forEach((k) => {
            if (k == "framesPerSecond") {
                fps = res[k];
            }
            let mark_change = false;
            if (k == "packetsLost") {
                mark_change = res[k] != this.last_video_packets_lost;
                this.last_video_packets_lost = res[k];
            }
            if (k == "framesDropped") {
                mark_change = res[k] != this.last_video_frames_dropped;
                this.last_video_frames_dropped = res[k];
            }
            if (k == "freezeCount") {
                mark_change = res[k] != this.last_video_freeze_count;
                this.last_video_freeze_count = res[k];
            }
            if (k !== "timestamp" && k !== "type" && k !== "id") {
                if (typeof res[k] === "object") {
                    stats_string += `${k}: ${JSON.stringify(res[k])}<br>`;
                } else {
                    if (mark_change) stats_string += `${k}: <span class="change">${res[k]}</span><br>`;
                    else stats_string += `${k}: ${res[k]}<br>`;
                }
            }
        });

        this.last_video_stats_string = stats_string;
        this.panel.fps = fps;
        this.panel.updateFps();
    }
}

