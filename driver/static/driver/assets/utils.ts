export default class Utils {
    static toQueryString(o: Object) { 
        var r='';
        for(var k in o){
            r+=encodeURIComponent(k)+'='+encodeURIComponent(o[k])+'&'
        }
        return r;
     }
}