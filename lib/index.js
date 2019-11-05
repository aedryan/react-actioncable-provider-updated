let React = require('react');
let PropTypes = require('prop-types');
let actionCable = require('actioncable');
let createReactClass = require('create-react-class');
let {Provider, Consumer} = React.createContext({});

Object.defineProperty(exports, "__esModule", {
  value: true
})


const CONSOLE_DEBUG = false;

const log = (...args) => {
  if (process.env.CONSOLE_DEBUG || CONSOLE_DEBUG) {
    console.debug(...args);
  }
};

class ActionCableProvider extends React.Component {

  constructor(props) {
    super(props);
    this.setupCable();
  }

  setupCable() {
    if (this.props.cable) {
      log('ActionCable setup via props');
      this.cable = this.props.cable;
    } else if (this.props.url) {
      log('ActionCable setup new');
      this.cable = actionCable.createConsumer(this.props.url);
    } else {
      throw new Error('Missing cable or URL prop');
    }
  }

  resetCable() {
    if (!this.props.cable && this.cable) {
      log('ActionCable RESET');
      this.cable.disconnect();
    }
  }

  componentWillUnmount() {
    log('ActionCable ActionCableProvider un-mounted');
    this.resetCable();
  }

  componentDidUpdate(prevProps) {
    // Props not changed
    if (this.props.cable === prevProps.cable && this.props.url === prevProps.url) {
      log('ActionCable ActionCableProvider componentDidUpdate no changes');
      return;
    }

    log('ActionCable ActionCableProvider componentDidUpdate changes -> RESETTING');
    // cable is created by self, disconnect it
    this.resetCable();

    // create or assign cable
    this.setupCable();
  }

  render() {
    return React.createElement(
        Provider,
        {
          value: {
            cable: this.cable
          }
        },
        this.props.children || null
    );
  }
};

ActionCableProvider.displayName = 'ActionCableProvider';

ActionCableProvider.propTypes = {
  cable: PropTypes.object,
  url: PropTypes.string,
  children: PropTypes.any
};

let ActionCableController = createReactClass({
  shouldComponentUpdate(nextProps, nextState) {
    // Props not changed
    if (this.props.cable === nextProps.cable && this.props.url === nextProps.url) {
      return false;
    } else {
      return true;

    }
  },
  componentDidMount: function () {
    let self = this;
    let _props = this.props;

    let onReceived = _props.onReceived;

    let onInitialized = _props.onInitialized;

    let onConnected = _props.onConnected;

    let onDisconnected = _props.onDisconnected;

    let onRejected = _props.onRejected;

    this.cable = this.props.cable.subscriptions.create(this.props.channel, {
      received: function (data) {
        onReceived && onReceived(data);
      },
      initialized: function () {
        onInitialized && onInitialized();
      },
      connected: function () {
        onConnected && onConnected();
      },
      disconnected: function () {
        onDisconnected && onDisconnected();
      },
      rejected: function () {
        onRejected && onRejected();
      }
    });
  },

//    componentWillUnmount: function () {
//        if (this.cable) {
//            this.props.cable.subscriptions.remove(this.cable);
//            this.cable = null;
//        }
//    },

  send: function (data) {
    if (!this.cable) {
      throw new Error('ActionCable component unloaded');
    }
    log('ActionCable ActionCableController sending', data);
    this.cable.send(data);
  },

  perform: function (action, data) {
    if (!this.cable) {
      throw new Error('ActionCable component unloaded');
    }
    log('ActionCable ActionCableController performing', action, data);
    this.cable.perform(action, data);
  },

  render: function () {
    return this.props.children || null;
  }
});

ActionCableController.displayName = 'ActionCableController';

ActionCableController.propTypes = {
  cable: PropTypes.object,
  onReceived: PropTypes.func,
  onInitialized: PropTypes.func,
  onConnected: PropTypes.func,
  onDisconnected: PropTypes.func,
  onRejected: PropTypes.func,
  children: PropTypes.any
};

let ActionCableConsumer = React.forwardRef(function (props, ref) {
  let Component = createReactClass({
    shouldComponentUpdate(nextProps, nextState) {
      // Props not changed
      if (this.props.cable === nextProps.cable && this.props.url === nextProps.url) {
        return false;
      } else {
        return true;

      }
    },
    render: function () {
      return React.createElement(Consumer, null, ({cable}) => {
        return React.createElement(
            ActionCableController,
            {
              cable,
              ...this.props,
              ref: this.props.forwardedRef
            },
            this.props.children || null
        );
      });
    }
  });

  Component.displayName = 'ActionCableConsumer';

  Component.propTypes = {
    onReceived: PropTypes.func,
    onInitialized: PropTypes.func,
    onConnected: PropTypes.func,
    onDisconnected: PropTypes.func,
    onRejected: PropTypes.func,
    children: PropTypes.any
  };

  return React.createElement(
      Component,
      {
        ...props,
        forwardedRef: ref
      },
      props.children || null
  );
});

exports.ActionCableConsumer = ActionCableConsumer
exports.ActionCableController = ActionCableController
exports.ActionCableProvider = ActionCableProvider

// Compatible old usage
exports.default = ActionCableProvider

