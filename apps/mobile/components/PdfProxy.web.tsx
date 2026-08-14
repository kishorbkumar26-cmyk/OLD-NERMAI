import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PdfProxy(props: any) {
  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.text}>PDF Viewer is not supported on the web preview.</Text>
      <Text style={styles.subtext}>Please test this screen in an Android/iOS emulator.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B', // tailwind slate-800
    padding: 20,
  },
  text: {
    color: '#F8FAFC', // slate-50
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    color: '#94A3B8', // slate-400
    fontSize: 14,
    textAlign: 'center',
  }
});
