
namespace game {

    import Color = ut.Core2D.Color;

    /** New System */
    export class UpdateGameStateSystem extends ut.ComponentSystem {
        
        Initialize(gameState: GameState):void {
            gameState.isInitialized = true;
            UserDataService.getCookies(gameState);
            this.UpdateStoreLabels(gameState);
            this.UpdateCursorObjects(gameState);
            this.RecalculateCps(gameState);
        }
        
        UpdateStoreLabels(gameState: GameState): void {
            let isBuyingMultiplier = gameState.purchaseModeIsBuying ? 1 : -1;
            for(let i = 0; i < gameState.storeButtons.length; i++)
            {
                let storePriceLabel = this.world.getComponentData(gameState.storePriceLabels[i], ut.Text.Text2DRenderer);
                storePriceLabel.text = game.UpdateGameStateSystem.FormatNumber(game.UpdateGameStateSystem.GetBuildingPrice(i, gameState.purchaseMultiplier * isBuyingMultiplier, gameState));
                this.world.setComponentData(gameState.storePriceLabels[i], storePriceLabel);

                let storeCountLabel = this.world.getComponentData(gameState.storeCountLabels[i], ut.Text.Text2DRenderer);
                storeCountLabel.text = game.UpdateGameStateSystem.FormatNumber(gameState.storeCounts[i]);
                this.world.setComponentData(gameState.storeCountLabels[i], storeCountLabel);
            }
        }
        
        OnUpdate():void {
            
            let deltaTime = this.scheduler.deltaTime();
            
            this.world.forEach([game.GameState], (gameState) =>{
                
                if(!gameState.isInitialized)
                { 
                    this.Initialize(gameState);
                }
                
                let cookieButton = this.world.getComponentData(gameState.cookieButton, game.CustomButton);
                if(cookieButton.JustClicked) 
                {
                    gameState.cookies += 1;
                }
                
                for (let i = 0; i < gameState.storeButtons.length; i++)
                {
                    let storeButton = this.world.getComponentData(gameState.storeButtons[i], game.CustomButton);
                    if(storeButton.JustClicked) {
                        this.BuyStore(i, gameState);
                    }
                }
                
                gameState.cookies += gameState.cps * deltaTime;
                
                let cookieCountLabel = this.world.getComponentData(gameState.cookieCountLabel, ut.Text.Text2DRenderer);
                cookieCountLabel.text = game.UpdateGameStateSystem.FormatNumber(Math.floor(gameState.cookies));
                this.world.setComponentData(gameState.cookieCountLabel, cookieCountLabel);
                
                this.SetPurchaseMode(gameState);
                this.SetPurchaseMultiplier(gameState);
                this.UpdateStoreButtons(gameState);
                this.UpdateStoreLabels(gameState);
                
                gameState.timer += deltaTime;
                if(gameState.timer > 60)
                {
                    gameState.timer = 0;
                    UserDataService.setCookies(gameState);
                }
            });
        }
        
        BuyStore(id, gameState: GameState): void {
            let isBuyingMultiplier = gameState.purchaseModeIsBuying ? 1 : -1;
            let buildingPrice = game.UpdateGameStateSystem.GetBuildingPrice(id, gameState.purchaseMultiplier * isBuyingMultiplier, gameState);
            if(buildingPrice > gameState.cookies && gameState.purchaseModeIsBuying) return;
            let purchaseCount = gameState.purchaseMultiplier * isBuyingMultiplier;
            if(!gameState.purchaseModeIsBuying && -purchaseCount > gameState.storeCounts[id])
            {
                purchaseCount = -gameState.storeCounts[id];
            }
            
            let storeCounts = gameState.storeCounts;
            storeCounts[id] += purchaseCount;
            gameState.storeCounts = storeCounts;
            
            gameState.cookies -= buildingPrice;
            gameState.cps += purchaseCount * gameState.storeCps[id];
            let cookeCpsLabel = this.world.getComponentData(gameState.cookieCpsLabel, ut.Text.Text2DRenderer);
            cookeCpsLabel.text = "per second: " + game.UpdateGameStateSystem.FormatNumber(gameState.cps, false);
            this.world.setComponentData(gameState.cookieCpsLabel, cookeCpsLabel);
            
            this.UpdateCursorObjects(gameState);
        }
        
        RecalculateCps(gameState: GameState) {
            for(let i = 0; i < gameState.storeCounts.length; i++) {
                gameState.cps += gameState.storeCounts[i] * gameState.storeCps[i];    
            }
            
            let cookeCpsLabel = this.world.getComponentData(gameState.cookieCpsLabel, ut.Text.Text2DRenderer);
            cookeCpsLabel.text = "per second: " + game.UpdateGameStateSystem.FormatNumber(gameState.cps, false);
            this.world.setComponentData(gameState.cookieCpsLabel, cookeCpsLabel);
        }
        
        UpdateStoreButtons(gameState: GameState): void {
            let isBuyingMultiplier = gameState.purchaseModeIsBuying ? 1 : -1;
            for(let i = 0; i < gameState.storeButtons.length; i++)
            {
                let storeButton = this.world.getComponentData(gameState.storeButtons[i], game.CustomButton);
                storeButton.IsInteractable = game.UpdateGameStateSystem.GetBuildingPrice(i, gameState.purchaseMultiplier * isBuyingMultiplier, gameState) <= gameState.cookies;
                if(!gameState.purchaseModeIsBuying){
                    storeButton.IsInteractable = gameState.storeCounts[i] > 0;
                }
                this.world.setComponentData(gameState.storeButtons[i], storeButton);
            }
        }
        
        UpdateCursorObjects(gameState: GameState): void {
            for(let i = 0; i < gameState.cursorObjects.length; i++)
            {
                let cursorObject = this.world.getComponentData(gameState.cursorObjects[i], ut.Core2D.Sprite2DRenderer);
                let isActive = gameState.storeCounts[0] >= i + 1;
                if(isActive)
                {
                    cursorObject.color = new Color(1,1,1,1);
                }
                else
                {
                    cursorObject.color = new Color(1,1,1,0);
                }
                this.world.setComponentData(gameState.cursorObjects[i], cursorObject);
            }
        }
        
        static GetBuildingPrice(id, count, gameState: GameState) {
            let isBuyingMultiplier = gameState.purchaseModeIsBuying ? 1 : -1;
            let cost = 0;
            
            if(count >= 0)
            {
                for(let i = 0; i < count; i++)
                {
                    cost += gameState.storePrices[id] * Math.pow(1.15, gameState.storeCounts[id] + i);
                }
            } 
            else
            {
                for(let i = 0; i < count; i++) 
                {
                    cost -= gameState.storePrices[id] * Math.pow(1.15, gameState.storeCounts[id] - i);
                }
            }
            if(cost == 0)
            {
                cost = gameState.storePrices[id];
            }
            return cost * isBuyingMultiplier;
        }

        static FormatNumber(num, roundDec = true) {
            let numStr;
            let suffix;
            num = Math.abs(num);
            if( num < 1000 )
            {
                if(roundDec)
                {
                    numStr = this.RoundNumber(num, 0);    
                }
                else
                {
                    numStr = this.RoundNumber(num, 3);
                }
                suffix = "";
            }
            else if( num < 1000000 )
            {
                numStr = num/1000;
                suffix = " thousand";
            }
            else if( num < 1000000000 )
            {
                numStr = num/1000000;
                suffix = " million";
            }
            else if( num < 1000000000000 )
            {
                numStr = num/1000000000;
                suffix = " billion";
            }
            else if( (num/10000) < 100000000000 ) //1000000000000000 
            {
                numStr = (num/10000)/100000000;
                suffix = " trillion";
            }
            else if( (num/10000) < 100000000000000 ) //1000000000000000000
            {
                numStr = (num/10000)/100000000000;
                suffix = " quadrillion";
            }
            else if( num < 1000000000000000000000 )
            {
                numStr = num/1000000000000000000;
                suffix = " quintillion";
            }
            else
            {
                numStr = num/1000000000000000000000;
                suffix = " sextillion";
            }
            return this.RoundNumber(numStr, 3).toString() + suffix; //"0.###"
        }

        static RoundNumber(num, dec) {
            return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
        }
        
        SetPurchaseMultiplier(gameState: GameState): void{
            if(this.world.getComponentData(gameState.Purchase1Toggle, game.CustomToggle).IsOn)
            {
                gameState.purchaseMultiplier = 1;
            }
            else if(this.world.getComponentData(gameState.Purchase10Toggle, game.CustomToggle).IsOn)
            {
                gameState.purchaseMultiplier = 10;
            }
            else if(this.world.getComponentData(gameState.Purchase100Toggle, game.CustomToggle).IsOn)
            {
                gameState.purchaseMultiplier = 100;
            }
        }

        SetPurchaseMode(gameState: GameState): void{
            gameState.purchaseModeIsBuying = this.world.getComponentData(gameState.BuyToggle, game.CustomToggle).IsOn;
        }
    }
}
