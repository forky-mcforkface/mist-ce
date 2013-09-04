define('app/controllers/keys', [
    'app/models/key',
    'ember',
    'jquery'
    ],
    /**
     * Keys controller
     *
     *
     * @returns Class
     */
    function(Key) {
        return Ember.ArrayController.extend({

            keyCount: 0,
            loadingKeys: false,

            init: function() {
                this._super();

                var that = this;

                that.addObserver('length', function() {
                    that.getSelectedKeyCount();
                });
                
                that.set('loadingKeys', true);
                
                $.getJSON('/keys', function(data) {
                    that.set('loadingKeys', false);
                    that.updateKeyList(data);
                }).error(function() {
                    that.set('loadingKeys', false);
                    Mist.notificationController.notify("Error loading keys");
                });
            },

            newKey: function(name, publicKey, privateKey, autoSelect) {
                item = {
                    'name': name,
                    'pub': publicKey,
                    'priv': privateKey
                };

                var that = this;
                $.ajax({
                    url: '/keys/' + name,
                    type: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify(item),
                    success: function(data) {
                        info('Successfully sent create key ', name);
                        // don't keep private key on the client
                        item.priv = null;
                        var key = Key.create(data);
                        that.addObject(key);
                        Ember.run.next(function(){
                            key.addObserver('selected', function() {
                                that.getSelectedKeyCount();
                            });
                            $('#keys-list').listview('refresh');
                            $('#keys-list input.ember-checkbox').checkboxradio();
                        });
                        
                        if (autoSelect == true){
                            Mist.machineAddController.set('newMachineKey', key);
                            Ember.run.next(function(){
                                $('.select-key-collapsible').collapsible({theme: "c"});
                                $('.select-key-collapsible .select-listmenu').listview({theme: "c"});
                                $('.select-key-collapsible').removeClass('ui-disabled');
                                $('.select-key-collapsible').collapsible('option','collapsedIcon','check');
                                $('.select-key-collapsible span.ui-btn-text').text(key.name);
                                $('.select-key-collapsible').trigger('collapse');                                 
                            });                                                    
                        }
                        Mist.keyAddController.newKeyClear();
                        $("#dialog-add-key").popup("close");
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify(jqXHR.responseText);
                        error(textstate, errorThrown, 'while creating key', name);
                    }
                });
            },
            
            editKey: function(oldName, name, publicKey, privateKey) {  
                item = {
                    'oldname': oldName,
                    'name': name,
                    'pub': publicKey,
                    'priv': privateKey
                };
        
                var that = this;
                $.ajax({
                    url: '/keys/' + name,
                    type: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify(item),
                    success: function(data) {
                        info('Successfully sent edit key ', name);
                        // don't keep private key on the client
                        item.priv = null;;
                        var key = that.getKeyByName(oldName);
                        key.set('name', name);
                        key.set('pub', publicKey);
                        $('#keys-list').listview('refresh');
                        Mist.keyAddController.newKeyClear();
                        $("#dialog-add-key").popup("close");
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify(jqXHR.responseText);
                        error(textstate, errorThrown, 'while editing key', name);
                    }
                });
            },

            getPrivKey: function(key, element) {
                payload = {
                    'action': 'get_private_key',
                    'key_id': key.name
                };
                var that = this;
                $.ajax({
                    url: '/keys/' + key.name,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully got private key ', name);
                        $(element).val(data).trigger('change');
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while getting key' + name);
                        error(textstate, errorThrown, 'while getting key', name);
                    }
                });
            },

            associateKeys: function(key, machines) {
                payload = {'key_id': key.name, 'machine_backend_list': machines};
                var that = this;
                $.ajax({
                    url: 'keys/associate/machines',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully associated key ', key.name);
                        key.set('machines', machines);
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while associating key'  +
                                key.name);
                        error(textstate, errorThrown, 'while associating key', key.name);
                    }
                });
            },

            associateKey: function(key_name, machine) {
                payload = {
                    'action': 'associate',
                    'key_id': key_name,
                    'backend_id': machine.backend.id,
                    'machine_id': machine.id
                };

                var key = this.getKeyByName(key_name);
                $.ajax({
                    url: '/keys/' + key_name,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully associated key ', key_name);
                        machine.keys.addObject(key);
                        Ember.run.next(function(){
                            $('.delete-key-button').button();
                        });
                        $('#keys-wrapper .ajax-loader').hide();
                        $('#associate-key-button').removeClass('ui-disabled');
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while associating key'  +
                                key_name);
                        error(textstate, errorThrown, 'while associating key', key_name);
                        $('#keys-wrapper .ajax-loader').hide();
                        $('#associate-key-button').removeClass('ui-disabled');
                    }
                });
            },

            associateUserKey: function(key, ssh_user, key_name, machine) {
                payload = {
                    'action': 'associate_ssh_user',
                    'ssh_user': ssh_user,
                    'key_id': key_name,
                    'backend_id': machine.backend.id,
                    'machine_id': machine.id
                };
                var key = this.getKeyByName(key_name);
                $.ajax({
                    url: '/keys/' + key_name,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully associated ssh user with key ', key_name);
                        key.machines.forEach(function(machineKey) {
                            if (machineKey[1] == machine.id) {
                                machineKey[2] = ssh_user;
                            }
                        });
                        $('.' + key.strippedname + ' .ajax-loader').hide();
                        $('.' + key.strippedname + ' .delete-key-container').show();
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while associating ssh user with key'  +
                                key_name);
                        error(textstate, errorThrown, 'while associating key', key_name);
                        $('.' + key.strippedname + ' .ajax-loader').hide();
                        $('.' + key.strippedname + ' .delete-key-container').show();
                    }
                });
            },

            getKeyByName: function(key_name) {
                var ret;
                this.forEach(function(key){
                    if (key.name == key_name) {
                        ret = key;
                    }
                });
                return ret;
            },

            disassociateKey: function(key, machine) {
                payload = {
                    'action': 'disassociate',
                    'key_id': key.name,
                    'backend_id': machine.backend.id,
                    'machine_id': machine.id
                };

                $.ajax({
                    url: '/keys/' + key.name,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function(data) {
                        info('Successfully disassociated key ', key.name);
                        machine.keys.removeObject(key);
                        key.machines.removeObject([machine.backend.id, machine.id]);
                    },
                    error: function(jqXHR, textstate, errorThrown) {
                        Mist.notificationController.notify('Error while disassociating key'  +
                                key.name);
                        error(textstate, errorThrown, 'while disassociating key', key.name);
                        $('.' + this.key.strippedname + ' .delete-key-container').show();
                        $('.' + this.key.strippedname + ' .ajax-loader').hide();
                    }
                });
            },

            getSelectedKeyCount: function() {
                var count = 0;
                this.content.forEach(function(item){
                    if (item.selected == true){
                        count+=1;
                    }
                });
                this.set('selectedKeyCount', count);
            },

            updateKeyList: function(data, mode) {
                var content = new Array();
                
                if (mode == 'append'){
                    this.forEach(function(item){
                        content.push(item);
                    });                    
                }  
                              
                data.forEach(function(item){
                    var key = Key.create(item);
                    content.push(key);
                    if (key.machines && key.machines.length > 0){
                        key.machines.forEach(function(item){
                            var machine = Mist.backendsController.getMachineById(item[0], item[1]);
                            if (machine != undefined) {
                                machine.keys.addObject(key);
                            }
                        });                        
                    }
                    
                });
                
                this.set('content', content);

                var that = this;
                Ember.run.next(function(){
                    Mist.keysController.forEach(function(item){
                        item.strippedname = item.name.split(' ').join('-');
                        item.addObserver('selected', function() {
                            that.getSelectedKeyCount();
                        });
                    });
                });
            }
        });
    }
);
