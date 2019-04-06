/* 
This is a hack to work around https://forum.unity.com/threads/bug-renderer-fails-to-take-into-account-screen-dpi.601087/
Instructions:
Put the following code in a Behavior / System which gets included in your game.
Place the code NEXT to your namespace definition i.e...
(function HDPI_Hacks_By_abeisgreat() {
  ...
})();
namespace game {
  ...
}
It should not go inside the namespace.
*/

(function HDPI_Hacks_By_abeisgreat() {
    const w = (window as any);

    const initialize_hack = () => {
        console.log("Initializing HDPI hacks v7 by @abeisgreat");
        const fakeMouseEventFn = (ev) => {
            const ut_HTML = w.ut._HTML;
            const fakeEvent = {
                type: ev.type,
                pageX: ev.pageX * window.devicePixelRatio,
                pageY: ev.pageY * window.devicePixelRatio,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            ut_HTML.mouseEventFn(fakeEvent);
            ev.preventDefault();
            ev.stopPropagation();
        };

        const fakeTouchEventFn = (ev) => {
            const ut_HTML = w.ut._HTML;
            const changedTouches = [];
            for (var index = 0; index < ev.changedTouches.length; index++) {
                const touch = ev.changedTouches[index];
                changedTouches.push({
                    identifier: touch.identifier,
                    pageX: touch.pageX * window.devicePixelRatio,
                    pageY: touch.pageY * window.devicePixelRatio
                });
            }
            const fakeEvent = {
                type: ev.type,
                changedTouches,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            ut_HTML.touchEventFn(fakeEvent);
            ev.preventDefault();
            ev.stopPropagation();
        };

        window.addEventListener("resize", function () {
            const ut = w.ut;

            ut._HTML.onDisplayUpdated(
                window.innerWidth * window.devicePixelRatio,
                window.innerHeight * window.devicePixelRatio,
                window.screen.width * window.devicePixelRatio,
                window.screen.height * window.devicePixelRatio,
                -1);

            ut._HTML.canvasElement.style.width = `${window.innerWidth}px`;
            ut._HTML.canvasElement.style.height = `${window.innerHeight}px`;

            ut._HTML.stopResizeListening();
            const mouseEvents = ["down", "move", "up"];
            const touchEvents = ["touch", "cancel", "move", "start", "end"];

            mouseEvents.forEach((type) => {
                const eventType = `mouse${type}`;
                ut._HTML.canvasElement.removeEventListener(eventType, fakeMouseEventFn);
                ut._HTML.canvasElement.addEventListener(eventType, fakeMouseEventFn);
            });

            touchEvents.forEach((type) => {
                const eventType = `touch${type}`;
                ut._HTML.canvasElement.removeEventListener(eventType, fakeTouchEventFn);
                ut._HTML.canvasElement.addEventListener(eventType, fakeTouchEventFn);
            });

            setTimeout(function () {
                mouseEvents.forEach((type) => {
                    ut._HTML.canvasElement.removeEventListener(`mouse${type}`, ut._HTML.mouseEventFn);
                });

                touchEvents.forEach((type) => {
                    ut._HTML.canvasElement.removeEventListener(`touch${type}`, ut._HTML.touchEventFn);
                });
            }, 100);
        });
        window.dispatchEvent(new Event("resize"));
    }

    const intervalID = setInterval(() => {
        const w = (window as any);
        const ut = w.ut;
        if (ut._HTML.canvasElement && w.known_ut_HTML !== ut._HTML) {
            w.known_ut_HTML = ut._HTML;
            clearInterval(intervalID);
            initialize_hack();
        }
    }, 10);
})();
namespace game {

    import Color = ut.Core2D.Color;

    /**
     * Update the sprite and other visual elements of buttons depending on their current state.
     */
    export class UpdateCustomButtonSystem extends ut.ComponentSystem {
        
        OnUpdate():void {

            let deltaTime = this.scheduler.deltaTime();
            this.world.forEach([game.CustomButton, ut.Core2D.Sprite2DRenderer, ut.UIControls.MouseInteraction],
                (button, spriteRenderer, mouseInteraction) => {

                    button.IsPressed = mouseInteraction.down && button.IsInteractable;
                    button.JustDown = !button.LastDown && mouseInteraction.down && button.IsInteractable;
                    button.JustUp = button.LastDown && !mouseInteraction.down && button.IsInteractable;
                    button.JustClicked = mouseInteraction.clicked && button.IsInteractable;

                    if (button.IsPressed) {
                        button.TimePressed += deltaTime;
                    }

                    if (button.JustDown || button.JustUp || mouseInteraction.over != button.IsPointerOver || button.LastIsInteractable != button.IsInteractable) {
                        button.LastIsInteractable = button.IsInteractable;

                        let transition = this.world.getComponentData(button.Transition, ut.UIControls.ColorTintTransition);
                        let color = transition.normal;
                        if (!button.IsInteractable) {
                            color = transition.disabled;
                        }
                        else if (mouseInteraction.over && button.IsPressed) {
                            color = transition.pressed;
                        }
                        else if (mouseInteraction.over) {
                            color = transition.hover;
                        }

                        if (this.world.exists(button.sprite2DRenderer)) {
                            let sprite2DRenderer = this.world.getComponentData(button.sprite2DRenderer, ut.Core2D.Sprite2DRenderer);
                            sprite2DRenderer.color = color;
                            this.world.setComponentData(button.sprite2DRenderer, sprite2DRenderer);
                        }
                    }

                    

                    button.IsPointerOver = mouseInteraction.over;
                    button.LastDown = mouseInteraction.down;
                    button.LastOver = mouseInteraction.over;
                });
        }
    }
}
