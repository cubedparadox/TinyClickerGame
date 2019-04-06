namespace game {

    import Color = ut.Core2D.Color;

    /**
     * Update the sprite and other visual elements of buttons depending on their current state.
     */
    export class UpdateCustomToggleSystem extends ut.ComponentSystem {
        
        OnUpdate():void {

            let deltaTime = this.scheduler.deltaTime();
            this.world.forEach([game.CustomToggle, ut.Text.Text2DRenderer, ut.UIControls.MouseInteraction],
                (button, spriteRenderer, mouseInteraction) => {

                    button.JustDown = !button.LastDown && mouseInteraction.down && button.IsInteractable;
                    button.JustUp = button.LastDown && !mouseInteraction.down && button.IsInteractable;
                    button.JustClicked = mouseInteraction.clicked && button.IsInteractable;

                    if(button.JustDown)
                    {
                        if(button.ToggleGroup == "") {
                            button.IsOn = !button.IsOn;
                        }
                        else if(button.IsOn == false) {
                            this.world.forEach([game.CustomToggle], (toggle) => {
                                if(toggle.ToggleGroup == button.ToggleGroup){
                                    toggle.IsOn = false;
                                }
                            });
                            button.IsOn = true;
                        }
                    }
                    
                    if (button.IsOn) {
                        button.TimePressed += deltaTime;
                    }

                    if (button.JustDown || button.JustUp || mouseInteraction.over != button.IsPointerOver || button.LastIsInteractable != button.IsInteractable) {
                        button.LastIsInteractable = button.IsInteractable;
                    }

                    let transition = this.world.getComponentData(button.Transition, ut.UIControls.ColorTintTransition);
                    let color = transition.normal;
                    if (!button.IsInteractable) {
                        color = transition.disabled;
                    }
                    else if (button.IsOn) {
                        color = transition.pressed;
                    }
                    else if (mouseInteraction.over) {
                        color = transition.hover;
                    }

                    if (this.world.exists(button.sprite2DRenderer)) {
                        let sprite2DRenderer = this.world.getComponentData(button.sprite2DRenderer, ut.Text.Text2DStyle);
                        sprite2DRenderer.color = color;
                        this.world.setComponentData(button.sprite2DRenderer, sprite2DRenderer);
                    }

                    button.IsPointerOver = mouseInteraction.over;
                    button.LastDown = mouseInteraction.down;
                    button.LastOver = mouseInteraction.over;
                });
        }
    }
}
