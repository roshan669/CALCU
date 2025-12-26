import { View, Text, TouchableOpacity, BackHandler } from "react-native";
import React, { useContext } from "react";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { styles } from "@/styles/homeScreenStyles";
import { HomeContext } from "@/hooks/useHome";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

export default function BottomSheet() {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleSheetClose();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );
  const handleSheetChanges = React.useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const {
    bottomSheetModalRef,
    addName,
    setAddName,
    setPerfer,
    perfer,
    handleAdd,
  } = useContext(HomeContext);

  const handleSheetClose = React.useCallback(() => {
    (bottomSheetModalRef as any)?.current?.close();
  }, []);

  const renderBackdrop = React.useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    []
  );
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.modalContentContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add New Item</Text>
        </View>

        <View style={styles.modalInputContainer}>
          <Text style={styles.inputLabel}>Item Name</Text>
          <BottomSheetTextInput
            placeholder="e.g., Groceries, Salary"
            value={addName}
            onChangeText={setAddName}
            style={styles.modalInput}
            autoCapitalize="words"
            placeholderTextColor="#adb5bd"
          />
        </View>

        <View style={styles.typeSelectionContainer}>
          <Text style={styles.inputLabel}>Type</Text>
          <View style={styles.typeButtonsRow}>
            <TouchableOpacity
              onPress={() => setPerfer("expense")}
              style={[
                styles.typeButton,
                styles.expenseTypeButton,
                perfer === "expense" && styles.expenseTypeButtonSelected,
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  perfer === "expense"
                    ? "arrow-down-circle"
                    : "arrow-down-circle-outline"
                }
                size={24}
                color={perfer === "expense" ? "#d32f2f" : "#e57373"}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  perfer === "expense" && styles.typeButtonTextSelected,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPerfer("income")}
              style={[
                styles.typeButton,
                styles.incomeTypeButton,
                perfer === "income" && styles.incomeTypeButtonSelected,
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  perfer === "income"
                    ? "arrow-up-circle"
                    : "arrow-up-circle-outline"
                }
                size={24}
                color={perfer === "income" ? "#388e3c" : "#81c784"}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  perfer === "income" && styles.typeButtonTextSelected,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              handleSheetClose();
              setAddName("");
              setPerfer("");
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={handleAdd}
          >
            <Text style={styles.confirmButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
