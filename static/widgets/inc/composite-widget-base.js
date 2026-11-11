import { MultiTopicSource } from "multitopic";

/**
 * Extend this class to implement a custom multi-topic composite widget as outlined in the code snippet below.
 * A working example - :doc:`Wi-Fi signal strength map</remote/wifi-map-example/>` - can be found `in the Extras 
 * repository <https://github.com/PhantomCybernetics/phntm_remote_extras/tree/main/examples/custom-wifi-map-panel-widget/>`_
 * and also :doc:`live in our demos </remote/demos/>`. 
 */
export class CompositePanelWidgetBase extends EventTarget {

    /**
     * Text to display as panel name
     * @static
     * @type {string}
     
     */
    static LABEL = "Widget name";
    /**
     * Default width in grid cell columns when created
     * @static
     * @type {number}
     */
    static DEFAULT_WIDTH = 5;
    /**
     * Default height in grid cell rows when created
     * @static
     * @type {number}
     */
	static DEFAULT_HEIGHT = 5;

    /**
     * @constructor
     * @param {Panel} panel :js:doc:`Panel` reference
     * @param {string} widget_css_class CSS class to use
     */
    constructor(panel, widget_css_class) {
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
         * If true, resize renderer attached to this widget automatically
         * @type {boolean}
         */
        this.autoresize_renderer = true; // if renderer exists, it will be resized before onResize is called

        /**
         * Reference to the widget's DOM element
         * @type {jQuery}
         */
        this.widget_el = $("#panel_widget_" + this.panel.n);
        this.widget_el.addClass("enabled");

        if (widget_css_class)
            this.widget_el.addClass(widget_css_class);

        /**
         * :js:doc:`MultiTopicSource` object
         * @type {MultiTopicSource}
         */
        this.sources = new MultiTopicSource(this);
    }

    /**
     * Setup menu items by adding new lines into the provided menu_els container
     * @param {jQuery} menu_els 
     */
    setupMenu(menu_els) {      
        this.sources.setupMenu(menu_els);
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
     * Called on panel/window resize
     */
    onResize() {

    }

    /**
     * Called when the panel is closed
     */
    onClose() {
        this.sources.close();
    }
}