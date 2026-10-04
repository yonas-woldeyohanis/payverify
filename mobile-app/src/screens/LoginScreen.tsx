import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ENV } from "@/config/env";

export function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [loginAlias, setLoginAlias] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(loginAlias.trim().toLowerCase(), pin.trim());
    } catch (err: any) {
      setError(err?.message ?? "Could not sign in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{ENV.APP_NAME}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {ENV.HOTEL_NAME} - Waiter Login
          </Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Staff login (e.g. abebe)"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            value={loginAlias}
            onChangeText={setLoginAlias}
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="PIN / Password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showPassword}
            value={pin}
            onChangeText={setPin}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: `${colors.danger}1A`, borderColor: `${colors.danger}4D` }]}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} style={{ marginRight: 6 }} />
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
            submitting && { opacity: 0.7 }
          ]}
          onPress={handleSubmit}
          disabled={submitting || !loginAlias || !pin}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.background }]}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center",
  },
  formContainer: {
    paddingHorizontal: 28,
  },
  header: {
    marginBottom: 40,
  },
  title: { 
    fontSize: 36, 
    fontWeight: "800", 
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: { 
    fontSize: 16, 
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
    marginRight: -10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { 
    fontWeight: "700", 
    fontSize: 18,
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  error: { 
    flex: 1,
    fontSize: 14,
  },
});
