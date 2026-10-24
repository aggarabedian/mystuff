import { QUOTES, Quote } from "@/lib/constants/quotes";
import { MaterialIcons } from "@expo/vector-icons";
import * as React from "react";
import {
    Animated,
    Easing,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { Card, IconButton, Text, useTheme } from "react-native-paper";

interface QuoteCardProps {
  quotes?: Quote[];
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function QuoteCard({
  quotes = QUOTES,
  title = "Thoughts on Stuff",
  style,
}: QuoteCardProps) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = React.useState(() => {
    if (quotes.length <= 1) return 0;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return dayOfYear % quotes.length;
  });
  const [fadeAnim] = React.useState(() => new Animated.Value(1));
  const [spinAnim] = React.useState(() => new Animated.Value(0));

  const handleShuffle = () => {
    if (quotes.length <= 1) return;

    // Trigger icon spin
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Fade out text, change quote, then fade in
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((prev) => {
        let nextIndex: number;
        do {
          nextIndex = Math.floor(Math.random() * quotes.length);
        } while (nextIndex === prev);
        return nextIndex;
      });

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const currentQuote = quotes[currentIndex] || quotes[0];
  if (!currentQuote) return null;

  // Map 0 -> 1 to 0deg -> 360deg for the spin effect
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }, style]}
      mode="outlined"
    >
      <Card.Content>
        {/* Header bar: Eyebrow badge + Shuffle Button */}
        <View style={styles.header}>
          <View style={styles.eyebrow}>
            <MaterialIcons
              name="auto-awesome"
              size={16}
              color={theme.colors.secondary}
            />
            <Text
              variant="labelMedium"
              style={[
                styles.eyebrowText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {title}
            </Text>
          </View>

          {quotes.length > 1 && (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <IconButton
                icon="shuffle"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                mode="outlined"
                onPress={handleShuffle}
                style={styles.shuffleBtn}
              />
            </Animated.View>
          )}
        </View>

        {/* Quote text and attribution with smooth fade transition */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text
            variant="bodyLarge"
            style={[styles.quoteText, { color: theme.colors.onSurface }]}
          >
            &quot;{currentQuote.quote}&quot;
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.attributionText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            — {currentQuote.attribution}
          </Text>
        </Animated.View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7E5E4", // Matching your warm light gray divider
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eyebrowText: {
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  shuffleBtn: {
    margin: 0,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    borderRadius: 8,
    width: 32,
    height: 32,
  },
  quoteText: {
    fontStyle: "italic",
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 12,
  },
  attributionText: {
    fontWeight: "600",
  },
});
