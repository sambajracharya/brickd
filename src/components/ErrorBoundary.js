import { Component } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// App-wide crash safety net. Without this, one thrown error anywhere
// white-screens the entire app with no way back. Error boundaries must
// be class components (React limitation), and this one deliberately
// uses NO theme/context/providers — it has to render even when those
// are the thing that crashed.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Dev aid: full details in the console / Metro logs.
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <Image
          source={require('../../assets/brick-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          Brick'd hit an unexpected error. Your saved foods and account are
          fine.
        </Text>
        {__DEV__ && (
          <Text style={styles.devDetail} numberOfLines={4}>
            {String(this.state.error?.message ?? this.state.error)}
          </Text>
        )}
        <TouchableOpacity style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 18,
  },
  title: {
    color: '#F4F6F8',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: '#9AA4B2',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
  },
  devDetail: {
    color: '#F87171',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#E8442D',
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 13,
    marginTop: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
