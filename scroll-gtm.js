<script>
/**
  * Scroll tracking plugin for GTM
  * Description - this code was derived from the Google On Steroid plugin: https://github.com/CardinalPath/gas/blob/master/src/plugins/max_scroll.js
  * Author - Bill Tripple, bill.tripple@cardinalpath.com
  * Version - 5, last update Nov 22, 2022
*/
(function(){
	var CP_ScrollTracking = (function () {
		/* configuration start */
		var SETTINGS={
            "event_name":"scroll",
            "percent_scrolled_parameter":"percent_scrolled",
            "percentage_threshold":100,  // this disables scroll tracking when the viewable space is not much greater than the full space, a value of "100" will always track.   
            "pageview_delay":100, // delay in milliseconds to wait for content to render on pageload events
            "spa_pageview_delay":1500, // delay in milliseconds to wait for content to render on historyChange events
		}     
		/* configuration ends */
      
       /* advanced settings - change with caution */
        SETTINGS.debug=false; // set to "false" in production environments.
       if(/(\?|\&)debug/.test(document.location.search)){
          SETTINGS.debug=false; 
        }
        SETTINGS.scroll_grouping="25";  // changing may lead to errors.
        SETTINGS.trigger_method="event" // setting to "page_unload" will fire event once per pageload.  Useful for reducing event volumes. Not recommended for SPA's.
      /* advanced settings ends */
        var scroll_history={};
		var documentElement = document.documentElement;
		var _current_bucket=0
		var _max_scroll = 0;

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
      
      /* use this instead of console.log statements */
      function debug_util(text,values){
        if(SETTINGS.debug==true){
         console.log(text,values);
        }
      }
      
      /* this will send skipped milestones for those who scroll quickly */
       function send_backfill(b_milestone){
         var b_dL = new Object();
         b_dL["event"] = SETTINGS.event_name;
         b_dL["backfilled"]="true";
         if(scroll_history[b_milestone]!=true){
           b_dL[SETTINGS.percent_scrolled_parameter] = b_milestone;
               debug_util("backfilling "+b_milestone+":",b_dL);
               dataLayer.push(b_dL);
              scroll_history[b_milestone]=true;
           }
         }
      
       /* this will evaluate skipped milestones for those who scroll quickly */
       function backFill(bucket){
         debug_util("init backfill",scroll_history);
         if(bucket=="50" && scroll_history[25]!=true){
           send_backfill("25");
         }else if(bucket=="75"){
           debug_util("checking 75","");
           var _milestones=[25,50];
           for (k = 0; k < _milestones.length; k++) {
             if(scroll_history[_milestones[k]]!=true){
              send_backfill(_milestones[k].toString());
              }
            }
         }else if(bucket=="100"){ 
           debug_util("checking 100","");
           var _milestones=[25,50,75];
           for (j = 0; j < _milestones.length; j++) {
             if(scroll_history[_milestones[j]]!=true){
              send_backfill(_milestones[j].toString());
              }
            }
         }   
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
			var bucket = (_max_scroll > SETTINGS.scroll_grouping ? 1 : 0) * (Math.floor((_max_scroll) / SETTINGS.scroll_grouping) * SETTINGS.scroll_grouping);
			if(_max_scroll>95){bucket=100;} // close enough
			if(bucket>_current_bucket){
				_current_bucket=_max_scroll;
				if(bucket==100){
					removeEvent( window, "scroll", _update_scroll_percentage ) 
				}
				if (typeof(dataLayer) !== 'undefined') {
					var dL = new Object();
					dL["event"] = SETTINGS.event_name;
                    dL["backfilled"]="false";
					dL[SETTINGS.percent_scrolled_parameter] = bucket.toString();
                    if((event.type=="scroll" && SETTINGS.trigger_method=="event")|event.type=="unload"){                
			          if(scroll_history[bucket]!=true){
                         debug_util("Data Layer pushed",dL)
                         dataLayer.push(dL) ;
                         scroll_history[bucket]=true;
                        // check if there is a need to backfill due to quick scrolling.
                         backFill(bucket);
                      }
                   }

				}
			}
		}
		
		return{  // public interface
				init: function(){
                  debug_util("scroll tracking initiated","")
                  var event_name="{{event}}";
                  debug_util("Scroll event","{{event}}")
                  var _timeout=SETTINGS.pageview_delay; // trigger immediatly
                  if(event_name=="gtm.historyChange"){
                      _timeout=SETTINGS.spa_pageview_delay; // add slight delay to wait for it to fully render
                      debug_util("delay scroll tracking",_timeout);
                    }
                    setTimeout(function(){   // adding timeout as time required to wait for SPA content to render
                  if(Math.round((window.innerHeight/document.documentElement.scrollHeight)*100)<=SETTINGS.percentage_threshold){
                    debug_util("passed threshold evaluation","");
                    
                      addEvent( window, "scroll", _update_scroll_percentage );
                      debug_util("scrollbar event listeners attatched","");
                       if(SETTINGS.trigger_method!="event"){
                            addEvent(window,"unload",_update_scroll_percentage);
                       }
                  }else{
                    debug_util("failed passed threshold evaluation","threshold:"+SETTINGS.percentage_threshold+"|timeout:"+_timeout);
                    debug_util("calculated",Math.round((window.innerHeight/document.documentElement.scrollHeight)*100))
                  }
                    },_timeout); // timeout function ends               
					return true;
				},
               getScrollHistory:function(){
                 return scroll_history;
               }
			}
	})();
	try{
		CP_ScrollTracking.init();      
	}catch(ex){}
})();
</script>
