import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { HelperText, TextInput, TextInputProps } from "react-native-paper";

export type FormTextFieldProps<T extends FieldValues> = Omit<
  TextInputProps,
  "value" | "onChangeText" | "onBlur" | "theme"
> & {
  name: Path<T>;
  control: Control<T>;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const FormTextField = <T extends FieldValues>({
  name,
  control,
  helperText,
  containerStyle,
  ...rest
}: FormTextFieldProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
      <View style={[styles.container, containerStyle]}>
        <TextInput
          {...rest}
          mode="outlined"
          onBlur={onBlur}
          onChangeText={onChange}
          value={value ?? ""}
          error={!!error}
        />
        {(!!error?.message || !!helperText) && (
          <HelperText type={error ? "error" : "info"} visible={true}>
            {error?.message || helperText}
          </HelperText>
        )}
      </View>
    )}
  />
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
