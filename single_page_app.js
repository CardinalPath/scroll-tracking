
//(function(){
	window.CP_ScrollTracking = (function () {
		/* configuration start */
		var SETTINGS={
			"scroll_grouping":"25", 
			"data_layer_event_name":"scroll",
			"data_layer_event_param1_name":"percent_scrolled"
		}
		/* configuration ends */
		
		var documentElement = document.documentElement;
		var _current_bucket=0;
		var _max_scroll = 0;

		
		// add event listener function
		function addListener( obj, type, fn ) {
			if ( obj.attachEvent ) {
				obj['e'+type+fn] = fn;
				obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
				obj.attachEvent( 'on'+type, obj[type+fn] );
			} else {
				obj.addEventListener( type, fn, false );
			}
		}
		
		// remove event listener function
		function removeListener( obj, type, fn ) {
			if ( obj.detachEvent ) {
				obj.detachEvent( 'on'+type, obj[type+fn] );
				obj[type+fn] = null;
			} else {
				obj.removeEventListener( type, fn, false );
			}
		}

		/**
		 * Get current browser viewpane height
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
      
      function _resetScroll(){
        _current_bucket=0;
        _max_scroll=0

      }
		
		function _update_scroll_percentage() {
			_max_scroll = Math.max(_get_scroll_percentage(), _max_scroll);
			var bucket = (_max_scroll > SETTINGS.scroll_grouping ? 1 : 0) * (Math.floor((_max_scroll) / SETTINGS.scroll_grouping) * SETTINGS.scroll_grouping);
			if(_max_scroll>95){bucket=100;} // close enough
			if(bucket>_current_bucket){
				//console.log("bucket"+bucket);
				_current_bucket=_max_scroll;
				if(bucket==100){
                    removeListener( window, "scroll", _update_scroll_percentage ) 
				}
				if (typeof(dataLayer) !== 'undefined') {
					var dL ={};
					dL.event = SETTINGS.data_layer_event_name;
					dL[SETTINGS.data_layer_event_param1_name] = bucket;
					dataLayer.push(dL)
				
					//_satellite.track("scroll",{"bucket":bucket});
					
				}
			}
		}
		
		return{  // public interface
				init: function(){
                    addListener( window, "scroll", _update_scroll_percentage );
					return true;
				},
                newPage:function(){    
                  _resetScroll();
                  addListener( window, "scroll", _update_scroll_percentage );
        }
          
			}
	})();
	try{
		CP_ScrollTracking.init();
	}catch(ex){console.log(ex);}
//})();
