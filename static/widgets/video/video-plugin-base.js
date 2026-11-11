/**
 * Extend this class to implement a custom plugin for the Video widget as outlined in the code snippet below.
 * A working example - :ref:`video overlay displaying TwistStamped messages as input keys <implementing-custom-video-overlays>` - can be found `in the Extras 
 * repository <https://github.com/PhantomCybernetics/phntm_remote_extras/tree/main/examples/custom-video-cmd-vel-overlay/>`_
 * and also :doc:`live in our demos </remote/demos/>`. 
 */
export class VideoPluginBase {
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
     */
    static SOURCE_DEFAULT_TOPIC = null; // some default topic, maybe
    /**
     * The maximum number of topics this plugin can handle, -1=unlimited (default)
     * @static
     * @type {number}
     */
    static SOURCE_MAX_NUM = -1; // limit the number of sources to be allowed to use

    /**
     * @constructor
     * @param {VideoWidget} video Base video widget reference
     */
    constructor(video) {
        /**
         * Reference to the base video object
         * @type {VideoWidget}
         */
        this.video = video;
        /**
         * Reference to :js:doc:`BrowserClient`
         * @type {BrowserClient}
         */
        this.client = this.video.client;
        /**
         * Reference to widget :js:doc:`Panel`
         * @type {Panel}
         */
        this.panel = this.video.panel;
        /**
         * Reference to :js:doc:`PanelUI`
         * @type {PanelUI}
         */
        this.ui = this.video.panel.ui;
        /**
         * Custom overlay data by topic, {topic_name => custom_overlay_data}
         * @type {object.<string, any>} 
         */
        this.overlays = {};
    }

    /**
     * Add topic to this plugin.
     * Called when the user selects a new topic as overlay input.
     * @param {string} topic 
     */
    addTopic(topic) {
        if (!this.overlays[topic])
			this.overlays[topic] = {};
    }

    /**
     * Setup menu items by adding new lines into the provided menu_els container
     * @param {jQuery} menu_els 
     */
    setupMenu(menu_els) {

    }

    /**
     * Called on panel/window resize
     */
    onResize() {

    }

    /**
     * Called when data for the topic is received
     * Init your visuals here
     * @param {string} topic 
     * @param {MsgType} msg 
     */
    onTopicData(topic, msg) {

    }

    /**
     * Remove all visuals for the topic here
     * Make sure new ones are created in the correct reference frame in onTopicData()
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
     * Clear all topics
     */
    clearAllTopics() {
        let topics = Object.keys(this.overlays);
        let that = this;
        topics.forEach((topic)=>{
            that.clearTopic(topic);
        });
    }
}