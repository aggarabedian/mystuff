import * as React from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Keyboard, StyleSheet, View } from "react-native";
import {
    HelperText,
    Menu,
    TextInput,
    TouchableRipple,
} from "react-native-paper";

export interface Option {
  label: string;
  value: string | number;
}

export interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: Option[];
  disabled?: boolean;
}

export const FormSelect = <T extends FieldValues>({
  name,
  control,
  label,
  options,
  disabled = false,
}: FormSelectProps<T>) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // Look up the display label based on the current form value
        const selectedOption = options.find((opt) => opt.value === value);

        return (
          <View style={styles.container}>
            <Menu
              visible={visible}
              onDismiss={() => setVisible(false)}
              style={styles.menu}
              anchor={
                <TouchableRipple
                  onPress={() => {
                    if (!disabled) {
                      Keyboard.dismiss(); // Close any open keyboards before showing the dropdown
                      setVisible(true);
                    }
                  }}
                  disabled={disabled}
                >
                  <View pointerEvents="none">
                    <TextInput
                      mode="outlined"
                      label={label}
                      value={selectedOption ? selectedOption.label : ""}
                      error={!!error}
                      disabled={disabled}
                      right={
                        <TextInput.Icon
                          icon={visible ? "menu-up" : "menu-down"}
                        />
                      }
                    />
                  </View>
                </TouchableRipple>
              }
            >
              {options.map((opt) => (
                <Menu.Item
                  key={String(opt.value)}
                  onPress={() => {
                    onChange(opt.value);
                    setVisible(false);
                  }}
                  title={opt.label}
                />
              ))}
            </Menu>

            {!!error && (
              <HelperText type="error" visible={true}>
                {error.message}
              </HelperText>
            )}
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  menu: {
    marginTop: 56, // Offsets the menu so it renders below the TextInput instead of over it
  },
});
