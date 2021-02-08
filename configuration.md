# Defining loggers via configuration

Although Loggers can be set up programmatically by instantiating
LogTargets and LogWriters, configuring their properties and attaching
to Logger instances, this can be a tedious process.

A set of one or more loggers may be configured in a JSON file and
created automatically.

Call `loadLoggerConfig(path)` with the path name of the configuration file
to establish your logger environment.

Or, call `setLoggerConfig(object)` with a realized configuration object if
you wish to configure in a manner other than a JSON file.

Once the configuration is realized, you may call `getLogger(name)` to
access the instance of your constructed loggers by name.

### Configuration file anatomy
The configuration file is a standard JSON syntax file.

It has the following skeletal structure:
```json
{
  "categories": [
      ...
  ],
  "colorSchemes": [
    ...
  ],
  "writers": [
    ...
  ],
  "loggers": [
    ...
  ]
}
```
Loggers are composed of one or more Writers, each of which specify an
output target, such as a console, a file, a service, or an in-memory record.

Each log statement is directed to a "Category" for the log type.  If
no category is given, a built-in 'Default' category is assumed.

Each Writer may be configured to display only certain categories.
In this way, different log targets can be set to display only those
message types that are relevant to their purpose.

Similarly, Writers may be configured to filter differing levels of
Log.

Writers whose target outputs support ANSI Color may utilize a configured
color scheme that specifies the colors to use for each element of the
log output line.  

#### categories
This block of the configuration declares which Categories of logging
are to be known in this context. There is one built-in category named
"Default".  This category is used when no specific category is given
in a logging statement. 

The "Default" category does not need to be declared in the "categories" block,
but is may be referred to in the "excludeCategories" entry of a Writer configuration.

Categories are typically defined to meet the needs of the application 
the Logging system will be used in.  Examples might include "Application",
"Component", "Service", "System", or other categorization terms.

A category entry is defined as an object group with two properties: "name"
and "description".  The "description" is optional, but it is helpful for
documentary purposes.

example:
```json
"categories": [
  {
    "name: "App",
    "description": "Pertains to activity in app business logic"      
  },
  {
    "name: "DB",
    "description": "Pertains to activity in data handling layer"
  }
]
```
Note that a configuration that declares no categories may omit the
"categories" block altogether. The 'Default' category is applied
regardless.

#### writers
A writer must be declared to define where log output should appear,
and how.  

Each entry in the "writers" array block has the following structure:

```json
      "name": "", -- Name to refer to this writer by
      "type": "", -- One of ("Console", "Memory", "File", or "Service")
      "includeCategories": []  -- array of category names to output
      "excludeCategories": [], -- array of category names to *not* output
      "includeLevels": [] -- array of level names to output
      "excludeLevels": [], -- array of level names to *not* output
      "display": {
        ...
      },
      "colors": {
        ...
      }

```
The `name` property should be given a name you wish to refer to this
writer as when you assign it to a logger.

The `type` property defines what type of output this is. 
Allowable options are:
- `Console` Defines a terminal console output
    - Additional property `consoleType` may be "tty" or "browser". The default is "tty". Use
    "browser" to support Javascript debugger console output for Google Chrome or similar targets.
- `Memory`  Defines a target that writes to a named string in memory that can be accessed via the API
    - Additional property `name` names the memory block that can be retrieved by
    API call.
- `File` Defines a log file destination
    - Additional property `path` defines the desired file path name.
- `Service` Defines a remote service destination
    - Additional property `url` defines the url of the service
    
Note that the handling for "Console" and "Memory" are built-in to the
_gen-logger_ package, whereas "File" and "Service" handling requires
some additional code supplied by the integration.

The `includeCategories` property, if defined, is an array of category names 
that are to be represented by this writer.  If not defined, all categories
are considered included (unless excluded with `excludeCategories`)
The "Default" category must be included in any list in order to be 
represented, although it will be included by default if `includeCategories`
is not defined.

The `excludeCategories` property, if defined, is an array of category names
that should _not_ be represented by this writer.  Allowable names are
those defined in the "categories" section and/or "Default".

The `includeLevels` property, if defined, is an array of Log Level names 
that are supported by this writer.  If not defined, all levels are 
considered included (unless excluded with `excludeLevels`)

The `excludeLevels` property, if defined, filters any of the named
Logging Levels from being output on this writer. If not defined,
no levels are excluded.

Note that a level name may be the full level-scope name, e.g. "debug",
or it may be one of the granular variants, e.g. "debug3".
Also note that the end result of `includeLevels` and `excludeLevels`
are such that one may include "debug" and exclude "debug3" (result: all debug
levels except debug3) or include "debug3" and exclude "debug" (result:
no debug level except debug3)

The `display` block has the following properties:

- `format`: one of "text" or "json".  "text" is the default if not defined.
- `order`: An array of element names in the order they should appear in the log display, or be included in a json output. Element names are   
    - `time` the hour:minute:seconds.milliseconds display of when the log even occurred
    - `function` the name of the source function
    - `source` the file:line of the source location
    - `category` the category name (not shown if Default)
    - `level` the category level
    - `message` the log message
- `supportsColor`: set to `true` for color output.

example:
```json
      "display": {
        "order": ["time", "function", "source", "category", "level", "message"],
        "supportsColor" : true
      },
```

The `colors` section can either define a complete color scheme as detailed 
in the `colorScheme` discussion next, or it may choose to inherit
and optionally modify a defined color scheme.

example:
```json
      "colors": {
        "inherits": "Standard"
      }
```

example of inheriting and modifying:
```json
      "colors": {
        "inherits": "Standard"
        "default": {
          "debug3": {
             "message": 44, 
          }         
        }       
      }
```

#### colorSchemes
The `colorSchemes` section is used to define the settings for color
to be used in color logging displays 

colorSchemes, if defined, declares an array of entries that have
the following top-level structure:
```json
{
  "name": "SchemeName",
  "default": {
    
  },
  "CategoryName": {
    
  },
  "CategoryName": {
    
  },
}
```
where `name` specifies the name to refer to this color scheme by when
applying to a writer `color` property.

the `default` lists the color choices per element and per level as described
below that will apply unless overridden by a subsequent declaration.

following this one or more optional `CategoryName` sections, where the
name of the section represents one of the declared category names allows
overrides that change the color declarations from the default for
log output within this category.

###### color specification

Each color element defined will accept a color definition as 
either a single value or as a two-value array.

The two-value array form declares both a foreground _and_ a background
color for the given element, whereas the single-value form declares only
the foreground color.


Colors are rendered as ANSI colors from the Extended 256 color (8-bit) ANSI set.
Support for this format may vary depending upon your flavor of host computer / terminal.

A description of this format and a reference chart of colors can be found here:
[https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit](https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit)

Colors from this table can be declared directly using the color number (e.g. '1' for dark red)
Note that the value 0 is not recognized.  If you want black, you may use the value 16.
You may use 0 to specify 'undefined' or 'unchanged'.

Colors may also be declared in RGB form in either 3-digit web hex (#ABC), 6-digit web hex (#ABCDEF) or
by decimal rgb using notation as in 'rgb(12, 230, 98)'

When declaring RGB values, note that these are algorithmically mapped to the ANSI color table and are rough
approximations at best.

###### color element properties
Each of these defines a component of the console log line output
and may be assigned a color (or two-value color array) as either a number or a string
as defined above.

- `background` Defines the background color of the line. Defaults to undefined. Single value only.
- `time` Defines the color of the time display
- `func` Defines the color of the function name display
- `file` Defines the color of the filename display
- `line` Defines the color of the source line number display 
- `category` Defines the color of the category name display
- `level` Defines the color of the level name display
- `message` Defines the color of the displayed log message
- `stack` set to `true` if a stack trace should follow this line
- `stackColor` Defines the color of the stack trace if enabled.  
- `startGroup` Defines the color of a group block heading
- `endGroup` Defines the color of a group block footer

###### definitions

the colorScheme should define a `default` block to declare the
baseline appearance of elements using the relevant properties above, 
like so:
```json
      "default": {
        "time": 1,
        "message": 4,
        "func": 24,
        "file": 240,
        "line": 0,
        "startGroup": ["#FFF", "#00F"],
        "endGroup": ["#555", "#ACA"],
```
and then, still within the `default` block, define any variations
per log level that distinguish this display from the baseline:

```json
      "default": {
        "time": 1,
        "message": 4,
        "func": 24,
        "file": 240,
        "line": 0,
        "startGroup": ["#FFF", "#00F"],
        "endGroup": ["#555", "#ACA"],

        "debug": {
          "level": 142,
          "message": 108,
        },
        "debug3": {
        "level": 142,
        "message": 242,
        },
        
        "log": {
          "level": 2,
          "message": 22,
        },
        "info": {
          "level": 45,
          "message": 18,
        },
        "warn": {
          "level": [0, 11],
          "message": 3,
        },
        "error": {
          "level": [15, 1],
          "message": 1,
          "stack": true,
          "stackColor": 242
        }
      },

```
Note that levels may be defined as the full scope, or at individual
granularity (1-9).

###### Colors per category
The above description explains how to set the 'default' category.
You may define variants on the default category per category name
by specifying those portions of the scheme you wish to modify from
the default for that category.
For example:
```json
    "default": {
        ...
    }, 
    "App": {
      "info": {
        "level": [0, 11]
        "message": 16
      }
      "error": {
        "stack": false
      }
    }
```

#### loggers

Finally, we get to the `loggers` section.  Here we declare a logger
by a name we will access it by via the API, and attach one or more
writers to it.

example:

```json
    {
      "name": "Main",
      "writers": ["Console", "LogFile"]
    }

```


  
