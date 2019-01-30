(function (global) {
    /**
     *
     * @param host 宿主
     * @param method_entry 方法入口
     * @param method_instance 方法实例
     * @constructor
     */
    function Hook() {
        let _this = Hook.prototype;

        if(arguments.length != 0) {
            if ((arguments[0] instanceof Object) || (arguments[0] instanceof Function)) {
                _this._host = arguments[0];
            }
            else
                throw new Error("The instance of Hook can't be created!");
        }

        return _this;
    }

    Hook.prototype = {
        _methods:[],
        /**
         * 获取方法入口的索引
         * @param host 宿主
         * @param method_entry 方法入口
         * @returns {*}
         */
        indexOfMethodEntry: function (method_entry) {
            let host = this._host;
            let entry_index = -1;
            for (let index = 0; index < this._methods.length; index++) {
                let curr_method = this._methods[index];
                if ((host === curr_method.host) && (method_entry === curr_method.method_entry)) {
                    entry_index = index;
                } else {
                    continue;
                }
            }
            return entry_index;
        },
        /**
         * 获取方法实例
         * @param host 宿主
         * @param method_entry 方法入口
         * @returns {undefined | function}
         */
        getMethodInstance: function (method_entry) {
            let host = this._host;
            let entry_index = this.indexOfMethodEntry(method_entry);
            return (typeof entry_index === "undefined") ? undefined : this._methods[entry_index].method_instance;
        },
        /**
         * 插入方法
         * @param host 宿主
         * @param method_entry 方法入口
         * @param method_instance 方法实例
         */
        insertMethod: function (method_entry, method_instance) {
            let host = this._host;
            this._methods.push({host, method_entry, method_instance});
        },
        /**
         * 删除方法
         * @param host 宿主
         * @param method_entry 方法入口
         */
        removeMethod: function (method_entry) {
            let host = this._host;
            let entry_index = this.indexOfMethodEntry(method_entry);
            if (typeof entry_index == -1)
                throw new Error("Hook.removeMethodEntry:he instance of Hook can't be removed!");
            else
                this._methods.splice(entry_index, 1);
        },
        /**
         * 装载钩子
         * @param host 宿主
         * @param method_entry 方法入口
         * @param is_proto 是否装载在原型链
         * @param operation 回调函数对象：{before: function(),after:function()}
         */
        installHook: function (method_entry,operation = {}) {
            let host = this._host;
            let is_proto = (host instanceof Function) ? true : false;
            if(typeof is_proto !== "boolean")
                is_proto = false;
            if(is_proto && !(host instanceof Function))
                throw new Error("Hook.installHook:The host isn't be instance of Function");
            if(!is_proto && !(host instanceof Object))
                throw new Error("Hook.installHook:The host isn't instance of Object");
            if(is_proto && !host.prototype.hasOwnProperty(method_entry))
                throw new Error("Hook.installHook:The prototype of host hasn't " + method_entry + " method!");
            if(!is_proto && !host.hasOwnProperty(method_entry))
                throw new Error("Hook.installHook:The instance of host hasn't " + method_entry + " method!");

            let _host = is_proto ? this._host.prototype : this._host;
            if(this.indexOfMethodEntry(method_entry) != -1)
                throw new Error("Hook.installHook:The method of host has Hooked!");

            let method_instance = _host[method_entry];
            this.insertMethod(method_entry,method_instance);

            Object.defineProperty(_host,method_entry,{
               value:function(){
                   let result = null;
                   if(!!operation.before && (operation.before instanceof Function))
                       operation.before(this,arguments);

                   result = method_instance.apply(this,arguments);

                   if(!!operation.after && (operation.after instanceof Function))
                       result = operation.after(this,arguments,result);

                   return result;
               }
            });
        },
        /**
         * 卸载钩子
         * @param host 宿主
         * @param method_entry 方法入口
         * @param is_proto 是否装载在原型链
         */
        unstallHook: function (method_entry) {
            let host = this._host;
            let is_proto = (host instanceof Function) ? true : false;
            let _host = ((host instanceof Function) && is_proto) ? host.prototype : host;
            if(this.indexOfMethodEntry(method_entry) == -1)
                throw new Error("Hook.unstallHook:The method hasn't  Hooked!");
            let method_instance = this.getMethodInstance(method_entry);
            Object.defineProperty(_host,method_entry,{value:method_instance});
            this.removeMethod(method_entry);
        }

    }

    // 全局调用
    global.Hook = Hook;
})(window);