
export class InputController {

    enabled = false;

    focused = false;

    keyPressed = new Set();

    activeActions = new Set();
    
    constructor(actionsToBind, target) {
        //Константы
        Object.defineProperty(this, 'ACTION_ACTIVATED', {
            value: "input-controller:action-activated",
            writable: false,
        });
        Object.defineProperty(this, 'ACTION_DEACTIVATED', {
            value: "input-controller:action-deactivated",
            writable: false,
        });
        //////////////

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);

        this.handleFocusIn = this.handleFocusIn.bind(this);
        this.handleFocusOut = this.handleFocusOut.bind(this);

        actionsToBind && this.bindActions(actionsToBind);

        target && this.attach(target);
    }

    bindActions(actionsToBind) {
        for(const prop in actionsToBind) {
            !actionsToBind[prop].enabled &&
            (actionsToBind[prop].enabled = false); 
        }
        !this._actionsToBind && (this._actionsToBind = {});
        this._actionsToBind = Object.assign(this._actionsToBind, actionsToBind);
    }

    enableAction(actionName) {
        this._actionsToBind[actionName].enabled = true;
    }

    disableAction(actionName) {
        this._actionsToBind[actionName].enabled = false;
    }

    isActionActive(action) {
        let at_least_one_key_is_pressed = false;
        this._actionsToBind[action].keys.forEach(key => {
            this.isKeyPressed(key) && (at_least_one_key_is_pressed = true)
        });

        return at_least_one_key_is_pressed && this.enabled && this._actionsToBind[action].enabled;
    }

    attach(target, dontEnable = false) {
        if(this.$target) {
            return;
        }
        this.enabled = !dontEnable;
        this.$target = target;

        target.addEventListener('keydown', this.handleKeyDown);
        target.addEventListener('keyup', this.handleKeyUp);

        target.addEventListener("focusin", this.handleFocusIn);
        target.addEventListener("focusout", this.handleFocusOut);
    }

    handleKeyDown(e) {
        this.keyPressed.add(e.keyCode);

        for(const action in this._actionsToBind) {
 
            if(!this.isActionActive(action))
                continue;

            const active_event = new CustomEvent(this.ACTION_ACTIVATED, {
                detail: {
                    nameAction: action
                }
            });
            this.$target.dispatchEvent(active_event);

            this.activeActions.add(action);
        }
    }

    handleKeyUp(e) {
        this.keyPressed.delete(e.keyCode);

        for(const action in this._actionsToBind) {
            if(this.isActionActive(action) || !this.activeActions.has(action))
                continue;
 
            const active_event = new CustomEvent(this.ACTION_DEACTIVATED, {
                detail: {
                    nameAction: action
                }
            });
            this.$target.dispatchEvent(active_event);

            this.activeActions.delete(action);
        }
    }

    handleFocusIn() {
        this.focused = true;
    }

    handleFocusOut() {
        this.focused = false;
    }

    detach() {
        this.$target.removeEventListener('keydown', this.handleKeyDown);
        this.$target.removeEventListener('keyup', this.handleKeyUp);
        this.$target.removeEventListener("focusin", this.handleFocusIn);
        this.$target.removeEventListener("focusout", this.handleFocusOut);

        this.$target = null;
        this.enabled = false;
    }

    isKeyPressed(keyCode) {
        return this.keyPressed.has(keyCode);
    }

    enableController() {
        this.enabled = true;
    }

    disableController() {
        this.enabled = false;
    }
}