Element.implement({

  /**
   * Bind a property of the instance to a target Object/Class
   *
   * @param {string} key The property name to bind.
   * @param {Object|Class} target The target to update on changes.
   */
  bindVar: function(key, target, opt_c) {

    this._initPrivateBoundProperties();

    // If we have a custom key defined in opt_c, use it as the target's key.
    var targetKey = (typeOf(opt_c) === 'string') ? opt_c : key;

    // If the last argument passed into this method is a boolean then the user
    // is telling if they want to bind two-ways.
    var twoWay = (arguments[arguments.length - 1] === true);

    // If this is an input, wire up the change event so we can also
    // notify target of user-changes to value. This is important because user-
    // edited values bypass the `set` method, so we trap them separately.
    if(this._isUserInputChange(this, key)) {

      if(!this._boundEvents[key]) {
        this._boundEvents = {};
      }

      // If this is the first time wiring up this property then
      // define the callback function for this property.
      if(!this._boundEvents[key]) {
        this._boundEvents[key] = {
          func: function(event) {
            this._notifyAll(key, this.get(key));
          }.bind(this),
          targets: {}
        };
      }

      // If this target has not been assiged to this property then
      // add a change-event listener and add the target to the bound list.
      if(!this._boundEvents[key].targets[target]) {
        this.addEvent('change', this._boundEvents[key].func);
      }

    }

    // Bind the key via the normal mechanism. Even if we bound the key above
    // using the event mechanism we still need to bind it here in case the
    // element's `set` method is ever used to change the value.
    if(!this._bound[key]) {
      this._bound[key] = [];
    }
    this._bound[key].push({
      target: target,
      key: targetKey
    });

    // Are we binding two-ways?
    if (twoWay && typeOf(target.bindVar) === 'function') {
      // bind target.targetKey to this.key
      target.bindVar(targetKey, this, key);
    }
  },

  /**
   * Initialize the instance's bound properties, if not already done.
   * This should be done in the constructor, but since Element is not a class
   * I cannot override `initialize`. Is there a way to add code to the
   * Element constructor?
   */
  _initPrivateBoundProperties: function() {
    if(!this._bound) { this._bound = {}; }
    if(!this._boundEvents) { this._boundEvents = {}; }
  },

  /**
   * Is this element editable via user-input?
   * @private
   * @return {boolean} True if user-editable element, false otherwise.
   */
  _isUserInputChange: function(elem, key) {

    // user-editable properties
    var props = ['value', 'checked', 'selected'];
    // user-editable elements
    var elems = ['input', 'select'];

    if(!elems.contains(elem.nodeName.toLowerCase())) { return false; }
    if(!props.contains(key)) { return false; }
    return true;

  }.protect(),

  /**
   * Remove a target from the binding
   */
  unbindVar: function(key, target, opt_c) {

    this._initPrivateBoundProperties();

    // If we have a custom key defined in opt_c, use it as the target's key.
    var targetKey = (typeOf(opt_c) === 'string') ? opt_c : key;

    // If the last argument passed into this method is a boolean then the user
    // is telling if they want to bind two-ways.
    var twoWay = (arguments[arguments.length - 1] === true);

    if(!this._bound[key]) { return; }

    if(target) {

      // Unbind the var from the _bound set.
      this._bound[key].some(function(item, index, array) {
        if(item.target === target && item.key === targetKey) {

          // Is this a two-way unbinding?
          if (twoWay && typeOf(target.unbindVar) === 'function') {
            target.unbindVar(targetKey, this, key);
          }

          delete array[index];
          return true;
        }
      });

    }
    else {
      delete this._bound[key];
    }
  },

  /**
   * Copied from Mootools Element, with additions
   */
  set: function(prop, value){
    var property = Element.Properties[prop];
    (property && property.set) ? property.set.call(this, value) : this.setProperty(prop, value);
    this._notifyAll(prop, value);
  }.overloadSetter(),

  /**
   * Notify all targets bound to a property when the prop changes.
   *
   * @private
   *
   * @param {string} key The property name.
   * @param {mixed} value The property value.
   */
  _notifyAll: function(key, value) {

    this._initPrivateBoundProperties();

    if(!this._bound[key]) { return; }

    Array.each(this._bound[key], function(item) {
      this._notify(item, key, value);
    }.bind(this));

  }.protect(),

  _notify: function(item, key, value) {

    this._initPrivateBoundProperties();

    // If it's a function, call it.
    if(item.target instanceof Function) {
      item.target(item.key, value);
    }
    // If it's got a setter, use it.
    else if(item.target.set && item.target.set instanceof Function) {
      item.target.set(item.key, value);
    }
    // Otherwise just set the property directly.
    else {
      item.target[item.key] = value;
    }

  }.protect()

});
