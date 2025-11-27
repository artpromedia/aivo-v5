import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  adaptations?: any[];
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
}) => {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.brainContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.brainBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.brainText]}>
          {message}
        </Text>
        <Text style={styles.timestamp}>
          {timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  brainContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  brainBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  brainText: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default MessageBubble;
