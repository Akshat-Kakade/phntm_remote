/**
 * Extend this class to implement a custom service input widget as outlined in the code snippet below.
 * A working example - :ref:`slider menu element <implementing-custom-service-widgets>` - can be found `in the Extras 
 * repository <https://github.com/PhantomCybernetics/phntm_remote_extras/tree/main/examples/custom-slider-service-widget/>`_
 * and also :doc:`live in our demos </remote/demos/>`. 
 */
export class ServiceInputBase {
	/**
	 * Service ID
	 * @type {string}
	 */
	id_service = null;
	/**
	 * Reference to :js:doc:`BrowserClient`
	 * @type {BrowserClient}
	 */
	client = null; // browser client ref

	/**
	 * @constructor
	 * @param {string} id_service Service ID
	 * @param {BrowserClient} client :js:doc:`BrowserClient` client reference
	 */
	constructor(id_service, client) {
		this.id_service = id_service;
		this.client = client;
	}

	/**
	 * Create your DOM elements here and append them to target_el
	 * @param {jQuery} target_el 
	 */
	makeElements(target_el) {
	}

	/**
	 * Update created DOM elements with value
	 * @param {SrvMsgType} value 
	 * @param {boolean} is_error 
	 */
	updateDisplay(value, is_error=false) {
	}

	/**
	 * Handle loading of the current value, i.e. via a getter service call
	 * Called on init and when nodes are updated
	 * Call done_cb() or err_cb() when done
	 * @param {Callback} done_cb 
	 * @param {Callback} err_cb 
	 */
	getCurrentValue(done_cb, err_cb) {
	}

	/**
	 * Triggered when another peer updates the service, override to update the UI
	 * @param {SrvMsgType} msg 
	 */
	onValueChanged(msg) {
		// triggered when another peer updates the input
		// override to update the UI
	}
}
