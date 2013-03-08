# component-install

Simple programmatic, asynchronous installation of a component

## Installation

    $ npm install component-install

## Usage

```javascript
var install = require('component-install');
var dev = true;
install(join(__dirname, 'my-component'), dev, function (err) {
  if (err) throw err;
});
```

## License

  MIT