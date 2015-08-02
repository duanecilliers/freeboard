(function () {

  var AsanaHelper = function(api_key)
  {

    var self = this;

    var client = Asana.Client.create().useBasicAuth(api_key);

    self.getWorkspaces = function()
    {
      return client.workspaces.findAll();
    }

    self.getUsers = function(workspace)
    {
      return client.users.findAll(workspace);
    }

    self.getUser = function(userId)
    {
      return client.users.findById(userId);
    }

    self.getUserTasks = function(userId, workspaceId)
    {
      return client.tasks.findAll({
        assignee: userId,
        workspace: workspaceId,
        opt_fields: 'id,name,assignee_status,completed,projects'
      });
    }
  };

  // ## A Datasource Plugin
  //
  // -------------------
  // ### Datasource Definition
  //
  // -------------------
  // **freeboard.loadDatasourcePlugin(definition)** tells freeboard that we are giving it a datasource plugin. It expects an object with the following:
  freeboard.loadDatasourcePlugin({
    // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
    "type_name"   : "asana_workspaces",
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    "display_name": "Asana Workspaces",
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        "description" : "Get workspaces from your Asana profile.",
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    "external_scripts": [
      "https://github.com/Asana/node-asana/releases/download/v0.9.1/asana-min.js"
    ],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    "settings"    : [
      {
        // **name** (required) : The name of the setting. This value will be used in your code to retrieve the value specified by the user. This should follow naming conventions for javascript variable and function declarations.
        "name"         : "api_key",
        // **display_name** : The pretty name that will be shown to the user when they adjust this setting.
        "display_name" : "API Key",
        // **type** (required) : The type of input expected for this setting. "text" will display a single text box input. Examples of other types will follow in this documentation.
        "type"         : "text",
        // **default_value** : A default value for this setting.
        "default_value": "",
        // **description** : Text that will be displayed below the setting to give the user any extra information.
        "description"  : "This is pretty self explanatory...",
                // **required** : If set to true, the field will be required to be filled in by the user. Defaults to false if not specified.
                "required" : true
      },
      {
        "name"         : "refresh_time",
        "display_name" : "Refresh Time",
        "type"         : "text",
        "description"  : "In seconds",
        "default_value": 86400
      }
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance   : function(settings, newInstanceCallback, updateCallback)
    {
      // myDatasourcePlugin is defined below.
      newInstanceCallback(new AsanaWorkspaceDataSource(settings, updateCallback));
    }
  });


  // ### Datasource Implementation
  //
  // -------------------
  // Here we implement the actual datasource plugin. We pass in the settings and updateCallback.
  var AsanaWorkspaceDataSource = function(settings, updateCallback)
  {
    // Always a good idea...
    var self = this;

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    var currentSettings = settings;

    /* This is some function where I'll get my data from somewhere */
    function getData()
    {
      var newData = [];
      var asana = new AsanaHelper(currentSettings.api_key);

      asana.getWorkspaces().then(function(w) {
        w.data.map(function(workspace) {
          newData.push(workspace);
        })
      }).then(function() {
        // I'm calling updateCallback to tell it I've got new data for it to munch on.
        updateCallback(newData);
      });
    }

    // You'll probably want to implement some sort of timer to refresh your data every so often.
    var refreshTimer;

    function createRefreshTimer(interval)
    {
      if(refreshTimer)
      {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function()
      {
        // Here we call our getData function to update freeboard with new data.
        getData();
      }, interval);
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function(newSettings)
    {
      // Here we update our current settings with the variable that is passed in.
      currentSettings = newSettings;
    }

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
    self.updateNow = function()
    {
      // Most likely I'll just call getData() here.
      getData();
    }

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function()
    {
      // Probably a good idea to get rid of our timer.
      clearInterval(refreshTimer);
      refreshTimer = undefined;
    }

    // Here we call createRefreshTimer with our current settings, to kick things off, initially. Notice how we make use of one of the user defined settings that we setup earlier.
    createRefreshTimer(currentSettings.refresh_time * 60);
  }

  // ## Asana Users Datasource Plugin
  // -------------------
  // **freeboard.loadDatasourcePlugin(definition)** tells freeboard that we are giving it a datasource plugin. It expects an object with the following:
  freeboard.loadDatasourcePlugin({
    // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
    "type_name"   : "asana_users",
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    "display_name": "Asana Users",
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        "description" : "Get users from a workspace in Asana profile.",
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    "external_scripts": [
      "https://github.com/Asana/node-asana/releases/download/v0.9.1/asana-min.js"
    ],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    "settings"    : [
      {
        // **name** (required) : The name of the setting. This value will be used in your code to retrieve the value specified by the user. This should follow naming conventions for javascript variable and function declarations.
        "name"         : "api_key",
        // **display_name** : The pretty name that will be shown to the user when they adjust this setting.
        "display_name" : "API Key",
        // **type** (required) : The type of input expected for this setting. "text" will display a single text box input. Examples of other types will follow in this documentation.
        "type"         : "text",
        // **default_value** : A default value for this setting.
        "default_value": "",
        // **description** : Text that will be displayed below the setting to give the user any extra information.
        "description"  : "This is pretty self explanatory...",
                // **required** : If set to true, the field will be required to be filled in by the user. Defaults to false if not specified.
                "required" : true
      },
      {
        "name"        : "workspace_id",
        "display_name": "Workspace ID",
        // **type "calculated"** : This is a special text input box that may contain javascript formulas and references to datasources in the freeboard.
        "type"        : "calculated"
      },
      {
        "name"         : "refresh_time",
        "display_name" : "Refresh Time",
        "type"         : "text",
        "description"  : "In seconds",
        "default_value": 86400
      }
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance   : function(settings, newInstanceCallback, updateCallback)
    {
      // myDatasourcePlugin is defined below.
      newInstanceCallback(new AsanaUsersDataSource(settings, updateCallback));
    }
  });


  // ### Datasource Implementation
  //
  // -------------------
  // Here we implement the actual datasource plugin. We pass in the settings and updateCallback.
  var AsanaUsersDataSource = function(settings, updateCallback)
  {
    // Always a good idea...
    var self = this;

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    var currentSettings = settings;

    /* This is some function where I'll get my data from somewhere */
    function getData()
    {
      var newData = [];
      var asana = new AsanaHelper(currentSettings.api_key);

      asana.getUsers(currentSettings.workspace_id).then(function(u) {
        u.data.map(function(user) {
          asana.getUser(user.id).then(function(user) {
            newData.push(user);
          }).then(function() {
            var users = _.sortBy(newData, 'name');
            // I'm calling updateCallback to tell it I've got new data for it to munch on.
            updateCallback(users);
          });
        });
      });
    }

    // You'll probably want to implement some sort of timer to refresh your data every so often.
    var refreshTimer;

    function createRefreshTimer(interval)
    {
      if(refreshTimer)
      {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function()
      {
        // Here we call our getData function to update freeboard with new data.
        getData();
      }, interval);
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function(newSettings)
    {
      // Here we update our current settings with the variable that is passed in.
      currentSettings = newSettings;
    }

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
    self.updateNow = function()
    {
      // Most likely I'll just call getData() here.
      getData();
    }

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function()
    {
      // Probably a good idea to get rid of our timer.
      clearInterval(refreshTimer);
      refreshTimer = undefined;
    }

    // Here we call createRefreshTimer with our current settings, to kick things off, initially. Notice how we make use of one of the user defined settings that we setup earlier.
    createRefreshTimer(currentSettings.refresh_time * 60);
  }

  // ## Asana Users Datasource Plugin
  // -------------------
  // **freeboard.loadDatasourcePlugin(definition)** tells freeboard that we are giving it a datasource plugin. It expects an object with the following:
  freeboard.loadDatasourcePlugin({
    // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
    "type_name"   : "asana_user_tasks",
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    "display_name": "Asana User Tasks",
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        "description" : "Get Asana Tasks for a particular user",
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    "external_scripts": [
      "https://github.com/Asana/node-asana/releases/download/v0.9.1/asana-min.js"
    ],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    "settings"    : [
      {
        // **name** (required) : The name of the setting. This value will be used in your code to retrieve the value specified by the user. This should follow naming conventions for javascript variable and function declarations.
        "name"         : "api_key",
        // **display_name** : The pretty name that will be shown to the user when they adjust this setting.
        "display_name" : "API Key",
        // **type** (required) : The type of input expected for this setting. "text" will display a single text box input. Examples of other types will follow in this documentation.
        "type"         : "text",
        // **default_value** : A default value for this setting.
        "default_value": "",
        // **description** : Text that will be displayed below the setting to give the user any extra information.
        "description"  : "This is pretty self explanatory...",
                // **required** : If set to true, the field will be required to be filled in by the user. Defaults to false if not specified.
                "required" : true
      },
      {
        "name"        : "workspace_id",
        "display_name": "Workspace ID",
        // **type "calculated"** : This is a special text input box that may contain javascript formulas and references to datasources in the freeboard.
        "type"        : "calculated"
      },
      {
        "name"         : "user_id",
        "display_name" : "User ID",
        "description"  : "If unsure, use the Asana Users Data Source.",
        "type"         : "calculated"
      },
      {
        "name"         : "refresh_time",
        "display_name" : "Refresh Time",
        "type"         : "text",
        "description"  : "In seconds",
        "default_value": 86400
      }
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance   : function(settings, newInstanceCallback, updateCallback)
    {
      // myDatasourcePlugin is defined below.
      newInstanceCallback(new AsanaUserTasksDataSource(settings, updateCallback));
    }
  });


  // ### Datasource Implementation
  //
  // -------------------
  // Here we implement the actual datasource plugin. We pass in the settings and updateCallback.
  var AsanaUserTasksDataSource = function(settings, updateCallback)
  {
    // Always a good idea...
    var self = this;

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    var currentSettings = settings;

    /* This is some function where I'll get my data from somewhere */
    function getData()
    {
      var newData = [];
      var asana = new AsanaHelper(currentSettings.api_key);

      console.log(currentSettings.user_id, currentSettings.workspace_id);

      asana.getUserTasks(currentSettings.user_id, currentSettings.workspace_id).then(function(tasks) {
        tasks.data.map(function(task) {
          newData.push(task);
        });
      }).then(function() {
        updateCallback(newData);
      });

      // asana.getUsers(currentSettings.workspace_id).then(function(u) {
      //   u.data.map(function(user) {
      //     asana.getUser(user.id).then(function(user) {
      //       newData.push(user);
      //     }).then(function() {
      //       var users = _.sortBy(newData, 'name');
      //       // I'm calling updateCallback to tell it I've got new data for it to munch on.
      //       updateCallback(users);
      //     });
      //   });
      // });
    }

    // You'll probably want to implement some sort of timer to refresh your data every so often.
    var refreshTimer;

    function createRefreshTimer(interval)
    {
      if(refreshTimer)
      {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function()
      {
        // Here we call our getData function to update freeboard with new data.
        getData();
      }, interval);
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function(newSettings)
    {
      // Here we update our current settings with the variable that is passed in.
      currentSettings = newSettings;
    }

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
    self.updateNow = function()
    {
      // Most likely I'll just call getData() here.
      getData();
    }

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function()
    {
      // Probably a good idea to get rid of our timer.
      clearInterval(refreshTimer);
      refreshTimer = undefined;
    }

    // Here we call createRefreshTimer with our current settings, to kick things off, initially. Notice how we make use of one of the user defined settings that we setup earlier.
    createRefreshTimer(currentSettings.refresh_time * 60);
  }

  // ## Asana User Profiles Widget
  // -------------------
  // **freeboard.loadWidgetPlugin(definition)** tells freeboard that we are giving it a widget plugin. It expects an object with the following:
  freeboard.loadWidgetPlugin({
    // Same stuff here as with datasource plugin.
    "type_name"   : "asana_user_profiles",
    "display_name": "Asana User Profiles",
        "description" : "Display a list of Asana user profiles",
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    // "external_scripts": [
    //   "https://github.com/Asana/node-asana/releases/download/v0.9.1/asana-min.js"
    // ],
    // **fill_size** : If this is set to true, the widget will fill be allowed to fill the entire space given it, otherwise it will contain an automatic padding of around 10 pixels around it.
    "fill_size" : false,
    "settings"    : [
      {
        "name": "users",
        "display_name": "Asana Users Object",
        "description": "User Asana Users Data Source",
        "type": "calculated"
      },
      {
        "name"        : "size",
        "display_name": "Size",
        "type"        : "text"
      }
    ],
    // Same as with datasource plugin, but there is no updateCallback parameter in this case.
    newInstance   : function(settings, newInstanceCallback)
    {
      newInstanceCallback(new AsanaUserProfilesWidget(settings));
    }
  });

  // ### Widget Implementation
  //
  // -------------------
  // Here we implement the actual widget plugin. We pass in the settings;
  var AsanaUserProfilesWidget = function(settings)
  {
    var self = this;
    var currentSettings = settings;

    // Here we create an element to hold the text we're going to display. We're going to set the value displayed in it below.
    var myTextElement = $('<div class="asana-user-profiles"></div>');

    // **render(containerElement)** (required) : A public function we must implement that will be called when freeboard wants us to render the contents of our widget. The container element is the DIV that will surround the widget.
    self.render = function(containerElement)
    {

      // Here we append our text element to the widget container element.
      $(containerElement).append(myTextElement);
    }

    // **getHeight()** (required) : A public function we must implement that will be called when freeboard wants to know how big we expect to be when we render, and returns a height. This function will be called any time a user updates their settings (including the first time they create the widget).
    //
    // Note here that the height is not in pixels, but in blocks. A block in freeboard is currently defined as a rectangle that is fixed at 300 pixels wide and around 45 pixels multiplied by the value you return here.
    //
    // Blocks of different sizes may be supported in the future.
    self.getHeight = function()
    {
      return parseInt(currentSettings.size);
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function(newSettings)
    {
      // Normally we'd update our text element with the value we defined in the user settings above (the_text), but there is a special case for settings that are of type **"calculated"** -- see below.
      currentSettings = newSettings;
    }

    // **onCalculatedValueChanged(settingName, newValue)** (required) : A public function we must implement that will be called when a calculated value changes. Since calculated values can change at any time (like when a datasource is updated) we handle them in a special callback function here.
    self.onCalculatedValueChanged = function(settingName, newValue)
    {
      // Remember we defined "the_text" up above in our settings.
      if(settingName == "users")
      {
        var output = '';
        newValue.map(function(user) {
          output += '<div class="asana-user">';
          output += '<a href="mailto:' + user.email + '">';
          if (user.photo !== null) {
            output += '<img title="' + user.name + '" src="' + user.photo.image_128x128 + '">';
          } else {
            output += '<img title="' + user.name + '" src="http://signposthq.co.za/images/signpost-logo.gif">';
          }
          output += '</a>';
          output += '</div>';
        });
        // Here we do the actual update of the value that's displayed in on the screen.
        $(myTextElement).html(output);
      }
    }

    // **onDispose()** (required) : Same as with datasource plugins.
    self.onDispose = function()
    {
    }
  }

  // ## Asana User Profile Widget
  // -------------------
  // **freeboard.loadWidgetPlugin(definition)** tells freeboard that we are giving it a widget plugin. It expects an object with the following:
  freeboard.loadWidgetPlugin({
    // Same stuff here as with datasource plugin.
    "type_name"   : "asana_user_profile",
    "display_name": "Asana User Profile",
        "description" : "Display an Asana user profile",
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    // "external_scripts": [
    //   "https://github.com/Asana/node-asana/releases/download/v0.9.1/asana-min.js"
    // ],
    // **fill_size** : If this is set to true, the widget will fill be allowed to fill the entire space given it, otherwise it will contain an automatic padding of around 10 pixels around it.
    "fill_size" : false,
    "settings"    : [
      {
        "name": "users",
        "display_name": "Asana User Object",
        "description": "Use the Asana Users Data Source",
        "type": "calculated"
      },
      {
        "name"        : "size",
        "display_name": "Size",
        "type"        : "text"
      }
    ],
    // Same as with datasource plugin, but there is no updateCallback parameter in this case.
    newInstance   : function(settings, newInstanceCallback)
    {
      newInstanceCallback(new AsanaUserProfilesWidget(settings));
    }
  });

  // ### Widget Implementation
  //
  // -------------------
  // Here we implement the actual widget plugin. We pass in the settings;
  var AsanaUserProfilesWidget = function(settings)
  {
    var self = this;
    var currentSettings = settings;

    // Here we create an element to hold the text we're going to display. We're going to set the value displayed in it below.
    var myTextElement = $('<div class="asana-user-profile"></div>');

    // **render(containerElement)** (required) : A public function we must implement that will be called when freeboard wants us to render the contents of our widget. The container element is the DIV that will surround the widget.
    self.render = function(containerElement)
    {

      // Here we append our text element to the widget container element.
      $(containerElement).append(myTextElement);
    }

    // **getHeight()** (required) : A public function we must implement that will be called when freeboard wants to know how big we expect to be when we render, and returns a height. This function will be called any time a user updates their settings (including the first time they create the widget).
    //
    // Note here that the height is not in pixels, but in blocks. A block in freeboard is currently defined as a rectangle that is fixed at 300 pixels wide and around 45 pixels multiplied by the value you return here.
    //
    // Blocks of different sizes may be supported in the future.
    self.getHeight = function()
    {
      return parseInt(currentSettings.size);
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function(newSettings)
    {
      // Normally we'd update our text element with the value we defined in the user settings above (the_text), but there is a special case for settings that are of type **"calculated"** -- see below.
      currentSettings = newSettings;
    }

    // **onCalculatedValueChanged(settingName, newValue)** (required) : A public function we must implement that will be called when a calculated value changes. Since calculated values can change at any time (like when a datasource is updated) we handle them in a special callback function here.
    self.onCalculatedValueChanged = function(settingName, newValue)
    {
      _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
      };

      // Remember we defined "the_text" up above in our settings.
      if(settingName == "users")
      {
        var user = newValue,
          image = user.photo !== null ? user.photo.image_36x36 : 'http://signposthq.co.za/images/signpost-logo.gif',
          template = _.template(
            '<a class="asana-user-profile-header href="mailto:{{ email }}">' +
              '<img title="{{ name }}" src="{{ image }}">' +
              '<strong>{{ name }}</strong><br>' +
              '<em>{{ email }}</em>' +
            '</a>' +
            '<h4>Tasks Scheduled for Today</h4>'
          );

        console.log(user);

        // Here we do the actual update of the value that's displayed in on the screen.
        $(myTextElement).html(template({
          email: user.email,
          name: user.name,
          image: image
        }));
      }
    }

    // **onDispose()** (required) : Same as with datasource plugins.
    self.onDispose = function()
    {
    }
  }

}());

