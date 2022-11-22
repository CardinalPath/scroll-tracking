/**
  * Scroll tracking plugin for GTM
  * Description - fires an event with custom metrics when users navigate to the next page to help analyse engagement
  * Author - Bill Tripple, btripple@cardinalpath.com
  * Version - 3.0
*/
(function(){
	var CP_ScrollTracking = (function () {
		/* configuration start */
		var SETTINGS={
		  "data_layer_event_value":"scrollEvent",  // events dataLayer field, default is scrollEvent
		  "data_layer_category_value":"scroll tracking", // Event Category value, default is scroll tracking
          "percentage_threshold":60,  // only initiate when window height / document height is less than %
		  "data_layer_milestone_25":"cm25",  // name of dataLayer field for 25% milestone metric, default is cm25
		  "data_layer_milestone_50":"cm50", // name of dataLayer field for 50% milestone metric, default is cm25
		  "data_layer_milestone_75":"cm75", // name of dataLayer field for 75% milestone metric, default is cm25
		  "data_layer_milestone_100":"cm100"// name of dataLayer field for 100% milestone metric, default is cm25
		}
		var currentMilestone;
		/* configuration ends */
		
		var SCROLLGROUPING=25;
		var MILESTONES=[25,50,75,100];
		
		var documentElement = document.documentElement;
		var _current_bucket=0
		var _max_scroll = 0;
		var dL = new Object();

		function addEvent( obj, type, fn ) {
		  if ( obj.attachEvent ) {
			obj['e'+type+fn] = fn;
			obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
			obj.attachEvent( 'on'+type, obj[type+fn] );
		  } else
			obj.addEventListener( type, fn, false );
		}
		function removeEvent( obj, type, fn ) {
		  if ( obj.detachEvent ) {
			obj.detachEvent( 'on'+type, obj[type+fn] );
			obj[type+fn] = null;
		  } else
			obj.removeEventListener( type, fn, false );
		}

		/**
		 * Get current browser viewpane heigtht
		 *
		 * @return {number} height.
		 */
		function _get_window_height() {
			return window.innerHeight || documentElement.clientHeight ||
				document.body.clientHeight || 0;
		}

		/**
		 * Get current absolute window scroll position
		 *
		 * @return {number} YScroll.
		 */
		function _get_window_Yscroll() {
			return window.pageYOffset || document.body.scrollTop ||
				documentElement.scrollTop || 0;
		}

		/**
		 * Get current absolute document height
		 *
		 * @return {number} Current document height.
		 */
		function _get_doc_height() {
			return Math.max(
				document.body.scrollHeight || 0, documentElement.scrollHeight || 0,
				document.body.offsetHeight || 0, documentElement.offsetHeight || 0,
				document.body.clientHeight || 0, documentElement.clientHeight || 0
			);
		}

		/**
		 * Get current vertical scroll percentage
		 *
		 * @return {number} Current vertical scroll percentage.
		 */
		function _get_scroll_percentage() {
			return (
				(_get_window_Yscroll() + _get_window_height()) / _get_doc_height()
			) * 100;
		}
		
		function _update_scroll_percentage() {
			_max_scroll = Math.max(_get_scroll_percentage(), _max_scroll);
			var bucket = (_max_scroll > SCROLLGROUPING ? 1 : 0) * (Math.floor((_max_scroll) / SCROLLGROUPING) * SCROLLGROUPING);
			if(_max_scroll>95){bucket=100;} // close enough
			if(bucket>_current_bucket){
				_current_bucket=_max_scroll;
				if(bucket==100){
					removeEvent( window, "scroll", _update_scroll_percentage ) 
				}
				if (typeof(dataLayer) !== 'undefined') {
					currentMilestone=bucket;
				}
			}
		}
		
		/**
		 * Set Custom Metrics
		 *
		 * @return {void} 
		 */
		function prepareHit(){
		  var num=MILESTONES.indexOf(currentMilestone);
		    for (i = 0; i <= num; i++) { 
		      dL[SETTINGS["data_layer_milestone_"+MILESTONES[i]]]=1;
		   }
		}
		
		/**
		 * Send dataLayer push
		 *
		 * @return {void} 
		 */
		function sendHit(){
		  var num=MILESTONES.indexOf(currentMilestone);
		  if(num>=0){
		    prepareHit();  
		    dL["event"]=SETTINGS.data_layer_event_value;
		    dL["eventCategory"]=SETTINGS.data_layer_category_value;
		    dL["eventAction"]=currentMilestone+"% scrolled";
		    dL["eventLabel"]=document.location.pathname;		
		    dataLayer.push(dL)
		   }
		}
		
		return{  // public interface
				init: function(){
                  if(Math.round((window.innerHeight/document.documentElement.scrollHeight)*100)<SETTINGS.percentage_threshold){
					addEvent( window, "scroll", _update_scroll_percentage );
					addEvent(window,"unload",sendHit);
                  }
					return true;
				}
			}
	})();
	try{
		CP_ScrollTracking.init();
	}catch(ex){}
})();
