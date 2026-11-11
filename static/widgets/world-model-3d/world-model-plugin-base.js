/**
 * Extend this class to implement a custom plugin for the World Model 3D widget as outlined in the code snippet below.
 * A working example - :ref:`overlay displaying Battery messages as virtual LEDs on the robot <implementing-custom-world-model-3d-overlays>` - can be found `in the Extras 
 * repository <https://github.com/PhantomCybernetics/phntm_remote_extras/tree/main/examples/custom-world-model-battery-plugin/>`_
 * and also :doc:`live in our demos </remote/demos/>`.
 */
export class WorldModel3DPluginBase {

    /**
     * Source topic message type
     * @static
     * @type {string}
     */
    static SOURCE_TOPIC_TYPE = 'some_msgs/msg/TopicType';
    /**
     * Source description to show in the overlay selector
     * @static
     * @type {string}
     */
    static SOURCE_DESCRIPTION = 'Describe topic type';  
    /**
     * Default topic to select or null (default)
     * @static
     * @type {string|null}
     * @default null
     */
    static SOURCE_DEFAULT_TOPIC = null;
    /**
     * The maximum number of topics this plugin can handle, -1=unlimited
     * @static
     * @type {number}
     * @default -1
     */
    static SOURCE_MAX_NUM = -1;
    /** 
     * @constructor
     * @param {WorldModel3DWidget} world_model - World Model base widget reference
     */
    constructor(world_model) {
        /**
         * World Model widget base object
         * @type {WorldModel3DWidget}
         */
        this.world_model = world_model;
        /**
         * :js:doc:`BrowserClient` reference
         * @type {BrowserClient}
         */
        this.client = this.world_model.client;
        /**
         * Reference to widget :js:doc:`Panel`
         * @type {Panel}
         */
        this.panel = this.world_model.panel;
        /**
         * :js:doc:`PanelUI` reference
         * @type {PanelUI}
         */
        this.ui = this.world_model.panel.ui;
        /**
         * Custom overlay data by topic, topic_name => custom_topic_data
         * @type {object.<string,any>}
         */
        this.overlays = {}; 
    }

    /** 
     * Add topic to this plugin.
     * Called when the user selects a new topic as overlay input.
     * @param {string} topic Topic name
     */
    addTopic(topic) {
        if (!this.overlays[topic])
			this.overlays[topic] = {};
    }

    /** 
     * Setup menu items by adding new lines into the provided menu_els container.
     * @param {jQuery} menu_els
     */
    setupMenu(menu_els) {
    }

    /** 
     * Called when data for the topic is received.
     * @param {string} topic Topic name
     * @param {MsgType} msg Message data
     */
    onTopicData(topic, msg) {
    }

    /** 
     * Called from the widget's rendering loop.
     */
    onRender() {
    }

    /** 
     * Called on panel/window resize
     */
    onResize() {
    }

    /** 
     * Remove all visuals for the topic here
     * @param {string} topic Topic name
     */
    clearVisuals(topic) {
    }

    /** 
     * Clear one topic and all its visuals
     * @param {string} topic Topic name
     */
    clearTopic(topic) {
        this.clearVisuals(topic);
        delete this.overlays[topic];
    }

    /** 
     * Clear all topics here
     */
    clearAllTopics() {
        let topics = Object.keys(this.overlays);
        let that = this;
        topics.forEach((topic)=>{
            that.clearTopic(topic);
        });
    }

    /** 
     * Called when robot's URDF model is removed (before update).
     * Clear all visuals here.
     */
    onModelRemoved() {
        let topics = Object.keys(this.overlays);
        topics.forEach((topic) => {
            this.clearVisuals(topic);
        });
    }
}