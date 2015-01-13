# &lt;shape-shifter&gt;

shape-shifter is an all-in-one icon element that can morph into different shapes. Pretty cool for animated icons but works for static icons, too!

> Maintained by **Martin Kleinschrodt** (https://github.com/maklesoft).

## Demo

> [Check it live](http://maklesoft.github.io/shape-shifter).

## Usage

### With Bower

1. Install the component

    ```sh
    $ bower install shape-shifter
    ```
2. Load polymer platform and shape-shifter element

    ```html
    <script src="bower_components/platform/platform.js"></script>
    <link rel="import" href="bower_components/shape-shifter/shape-shifter.html">
    ```

3. Start using it!

    ```html
    <shape-shifter shape="plus"></shape-shifter>
    ```

### Without Bower

1. Import Web Components' polyfill:

    ```html
    <script src="//cdnjs.cloudflare.com/ajax/libs/polymer/0.3.4/platform.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/polymer/0.3.4/polymer.js"></script>
    ```

2. Import Custom Element:

    ```html
    <link rel="import" href="shape-shifter.html">
    ```

3. Start using it!

    ```html
    <shape-shifter shape="plus"></shape-shifter>
    ```

## Options

Attribute  | Options                   | Default             | Description
---        | ---                       | ---                 | ---
`shape`    | plus, cancel, check, menu, more, left, right, top, bottom | [empty] | The shape to take on. If empty, will show nothing.
`color`    | *string*                  | `#000`              | The color of the element
`springy`  | *boolean*                 | `false`             | Use a different animation

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

For detailed changelog, check [Releases](https://github.com/maklesoft/shape-shifter/releases).

## License

[MIT License](http://opensource.org/licenses/MIT)