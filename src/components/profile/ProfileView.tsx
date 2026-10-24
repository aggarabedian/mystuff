import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    Text,
    useTheme,
} from "react-native-paper";

import { useAuth, useNotification } from "@/providers";
import { FormTextField } from "@/components/forms/FormTextField";
import { ApiError, navigateToAuth, profileApi } from "@/lib/api/client";
import { getDisplayName, getInitials } from "@/lib/utils/profile";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

export function ProfileView() {
  const theme = useTheme();
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    profile,
    profileLoading,
    setProfile,
  } = useAuth();
  const { showNotification } = useNotification();

  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      avatarUrl: "",
    },
  });

  React.useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile, reset]);

  const watchedFirstName =
    useWatch({ control, name: "firstName" }) ?? "";
  const watchedLastName = useWatch({ control, name: "lastName" }) ?? "";
  const watchedAvatarUrl = useWatch({ control, name: "avatarUrl" }) ?? "";

  const liveInitials = getInitials(
    watchedFirstName,
    watchedLastName,
    user?.name || user?.email,
  );
  const liveDisplayName = getDisplayName(
    watchedFirstName,
    watchedLastName,
    user?.name || user?.email,
  );
  const liveAvatarSrc = watchedAvatarUrl.trim() || undefined;

  const onSubmit = async (data: ProfileFormData) => {
    setErrorMsg(null);
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();

    if (!firstName) {
      showNotification("First name is required", "error");
      return;
    }
    if (!lastName) {
      showNotification("Last name is required", "error");
      return;
    }

    const avatarUrl = data.avatarUrl.trim() ? data.avatarUrl.trim() : null;

    try {
      setSaving(true);
      const updatedProfile = await profileApi.update({
        firstName,
        lastName,
        avatarUrl,
      });

      setProfile(updatedProfile);
      reset({
        firstName: updatedProfile.firstName || "",
        lastName: updatedProfile.lastName || "",
        avatarUrl: updatedProfile.avatarUrl || "",
      });
      showNotification("Profile updated successfully!", "success");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to update profile";
      setErrorMsg(msg);
      showNotification(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClearAvatar = () => {
    setValue("avatarUrl", "", { shouldDirty: true });
  };

  const handleCancel = () => {
    if (profile) {
      reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        avatarUrl: profile.avatarUrl || "",
      });
    } else {
      reset({ firstName: "", lastName: "", avatarUrl: "" });
    }
  };

  if (authLoading || (user && profileLoading)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Card style={styles.authCard}>
          <Card.Content style={styles.authCardContent}>
            <View style={styles.lockIconBox}>
              <MaterialIcons
                name="lock-outline"
                size={28}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <Text variant="titleLarge" style={styles.authTitle}>
              Sign In Required
            </Text>
            <Text variant="bodyMedium" style={styles.authSubtitle}>
              You must be signed in to view and edit your profile.
            </Text>
            <Button mode="contained" onPress={() => navigateToAuth("login")}>
              Sign In
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <View
          style={[
            styles.headerIconBox,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <MaterialIcons name="manage-accounts" size={28} color="#FFF" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Account Profile
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Manage your personal identity, display name, and avatar settings.
          </Text>
        </View>
      </View>

      <Card style={styles.mainCard}>
        <Card.Content>
          {/* Avatar Live Preview */}
          <View
            style={[
              styles.previewBox,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            {liveAvatarSrc ? (
              <Avatar.Image size={80} source={{ uri: liveAvatarSrc }} />
            ) : (
              <Avatar.Text size={80} label={liveInitials} />
            )}
            <View style={styles.previewInfo}>
              <Text variant="titleLarge" style={styles.previewName}>
                {liveDisplayName}
              </Text>
              {(profile?.email || user.email) && (
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {profile?.email || user.email}
                </Text>
              )}
              <View style={styles.chipContainer}>
                <Chip
                  mode="outlined"
                  textStyle={{ fontSize: 12 }}
                  style={styles.chip}
                >
                  Auth0 Verified
                </Chip>
                {profile?.createdAt && (
                  <Chip
                    mode="outlined"
                    textStyle={{ fontSize: 12 }}
                    style={styles.chip}
                  >
                    Member since{" "}
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </Chip>
                )}
              </View>
            </View>
          </View>

          {/* Info Banner */}
          <View
            style={[
              styles.infoBanner,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <MaterialIcons
              name="info-outline"
              size={20}
              color={theme.colors.onSecondaryContainer}
            />
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.onSecondaryContainer },
              ]}
            >
              The profile photo uses a direct image URL. If no image URL is
              provided, your initials ({liveInitials}) are displayed.
            </Text>
          </View>

          {errorMsg && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Text style={{ color: theme.colors.onErrorContainer }}>
                {errorMsg}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.row}>
              <FormTextField
                name="firstName"
                control={control}
                label="First Name"
                placeholder="e.g. Ada"
                containerStyle={styles.halfWidth}
              />
              <FormTextField
                name="lastName"
                control={control}
                label="Last Name"
                placeholder="e.g. Lovelace"
                containerStyle={styles.halfWidth}
              />
            </View>

            <View>
              <FormTextField
                name="avatarUrl"
                control={control}
                label="Avatar Image URL (Optional)"
                placeholder="https://images.example.com/avatar.jpg"
                helperText="Enter a direct HTTPS image URL, or clear it to use your initials."
              />
              {!!watchedAvatarUrl && (
                <Button
                  mode="text"
                  icon="close"
                  onPress={handleClearAvatar}
                  style={styles.clearAvatarBtn}
                  labelStyle={{ fontSize: 12 }}
                >
                  Clear Avatar URL
                </Button>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {isDirty ? (
              <>
                <Button
                  mode="outlined"
                  disabled={saving}
                  onPress={handleCancel}
                  style={styles.actionBtn}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  disabled={saving}
                  loading={saving}
                  onPress={() => {
                    void handleSubmit(onSubmit)();
                  }}
                  style={styles.actionBtn}
                >
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </>
            ) : (
              <Button
                mode="contained"
                onPress={() => router.push("/")}
                style={styles.actionBtn}
              >
                Close
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  authCard: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 400,
  },
  authCardContent: {
    alignItems: "center",
    padding: 24,
  },
  lockIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  authTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  authSubtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 24,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  mainCard: {
    borderRadius: 16,
  },
  previewBox: {
    padding: 20,
    borderRadius: 12,
    flexDirection: "column", // Default to column for mobile
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  previewInfo: {
    alignItems: "center", // Center text on mobile
  },
  previewName: {
    fontWeight: "bold",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    borderRadius: 16,
  },
  infoBanner: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  clearAvatarBtn: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  divider: {
    marginVertical: 24,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionBtn: {
    minWidth: 100,
  },
});
