
namespace game {

    /** Save and load player data into web cookies */
    export class UserDataService {

        static getCookies(gameState: GameState) {
            let cookieValue = Number(this.getCookie("Cookies"));
            if(cookieValue) {
                gameState.cookies = Number(cookieValue);    
            }
            else {
                gameState.cookies = 0;
            }

            for(let i = 0; i < gameState.storeCounts.length; i++)
            {
                let storeCounts = gameState.storeCounts;
                let buildingValue = Number(this.getCookie("Building" + i.toString()));
                if(buildingValue) {
                    storeCounts[i] = Number(buildingValue);
                }
                else {
                    storeCounts[i] = 0;
                }
                gameState.storeCounts = storeCounts;
            }
             
        }
        
        static setCookies(gameState: GameState) {
            
            this.setCookie("Cookies", String(gameState.cookies));
            for(let i = 0; i < gameState.storeCounts.length; i++)
            {
                this.setCookie("Building" + i.toString(), String(gameState.storeCounts[i]));    
            }
        }
        
        static getCookie(name: string) {
            const value = "; " + document.cookie;
            const parts = value.split("; " + name + "=");
            if (parts.length == 2) {
                return parts.pop().split(";").shift();
            }
        }
        
        static setCookie(name: string, val: string) {
            const date = new Date();
            const value = val;
            date.setTime(date.getTime() + (1000 * 24 * 60 * 60 * 1000));
            document.cookie = name + "=" + value + "; expires=" + date.toUTCString() + "; path=/";
        }

        static deleteCookie(name: string) {
            const date = new Date();
            date.setTime(date.getTime() + (-1 * 24 * 60 * 60 * 1000));
            document.cookie = name + "=; expires=" + date.toUTCString() + "; path=/";
        }

        static deleteAllCookies() {
            var cookies = document.cookie.split(";");
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i];
                var eqPos = cookie.indexOf("=");
                var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
        }
    }
}
