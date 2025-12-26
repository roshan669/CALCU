import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Table, Row, Rows } from "react-native-table-component";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

// Interfaces
interface ReportItem {
  name: string;
  value: number | string;
}
interface ReportDataEntry {
  todaysDate: string;
  totalGrossIncome: string;
  calculatedNetIncome: string;
  month: string;
  all: ReportItem[];
  time: string;
}

export default function Report() {
  const [reportData, setReportData] = useState<ReportDataEntry[]>([]);
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [selectedMonthTitle, setSelectedMonthTitle] =
    useState<string>("Select Month");
  const isMounted = useRef(true);

  // --- AsyncStorage Interaction ---
  const getAllMonthKeys = useCallback(async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const monthKeys = keys
        .filter((key) => key !== "perfer" && /^[A-Za-z]{3} \d{4}$/.test(key))
        .sort((a, b) => {
          try {
            const dateA = new Date(a);
            const dateB = new Date(b);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
            return dateA.getTime() - dateB.getTime();
          } catch (e) {
            console.warn("Date sorting issue:", e);
            return 0;
          }
        });
      return monthKeys;
    } catch (error) {
      console.error("Error getting keys:", error);
      ToastAndroid.show("Failed to get stored months", ToastAndroid.SHORT);
      return [];
    }
  }, []);

  const checkAndClearOldData = useCallback(
    async (monthKey: string) => {
      // ... (implementation remains the same) ...
      const NINETY_DAYS_MS = 365 * 24 * 60 * 60 * 1000;
      try {
        const storedData = await AsyncStorage.getItem(monthKey);
        if (storedData) {
          const reportDataForMonth: ReportDataEntry[] = JSON.parse(storedData);
          if (reportDataForMonth?.length > 0 && reportDataForMonth[0]?.time) {
            const firstReportDate = new Date(reportDataForMonth[0].time);
            if (isNaN(firstReportDate.getTime())) {
              console.warn(
                `(Report.js) Invalid date format in key ${monthKey}, skipping cleanup.`
              );
              return;
            }
            const currentDate = new Date();
            if (
              currentDate.getTime() - firstReportDate.getTime() >=
              NINETY_DAYS_MS
            ) {
              await AsyncStorage.removeItem(monthKey);
              if (isMounted.current) {
                ToastAndroid.show(
                  `Cleared data older than 90 days for ${monthKey}.`,
                  ToastAndroid.LONG
                );
                const updatedMonths = await getAllMonthKeys();
                setAllMonths(updatedMonths);
                if (monthKey === selectedMonthTitle) {
                  setReportData([]);
                  setSelectedMonthTitle("Select Month");
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(
          `(Report.js) Error checking/clearing data for ${monthKey}:`,
          error
        );
      }
    },
    [selectedMonthTitle, getAllMonthKeys]
  );

  const loadReportData = useCallback(async (month: string) => {
    // ... (implementation remains the same) ...
    if (!isMounted.current) return;
    setSelectedMonthTitle(month);
    setReportData([]);
    try {
      const storedData = await AsyncStorage.getItem(month);
      if (!isMounted.current) return;

      if (!storedData) {
        ToastAndroid.show(`No data found for ${month}`, ToastAndroid.SHORT);
        return;
      }

      const parsedData: ReportDataEntry[] = JSON.parse(storedData);
      if (isMounted.current) {
        setReportData(parsedData);
      }
    } catch (error) {
      console.error(
        `(Report.js) Error loading or parsing data for ${month}:`,
        error
      );
      if (isMounted.current) {
        ToastAndroid.show(
          `Error loading data for ${month}`,
          ToastAndroid.SHORT
        );
      }
    }
  }, []);

  // --- Effect for Initial Load & Cleanup ---
  useEffect(() => {
    isMounted.current = true;
    const performCleanup = async () => {
      const keys = await getAllMonthKeys();
      if (!isMounted.current) return;
      await Promise.all(keys.map((key) => checkAndClearOldData(key)));
    };
    performCleanup();

    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const keys = await getAllMonthKeys();
        if (!isMounted.current) return;
        setAllMonths(keys);

        if (keys.length > 0) {
          const latestMonth = keys[keys.length - 1];
          loadReportData(latestMonth);
        } else {
          setSelectedMonthTitle("No Data Found");
          setReportData([]);
        }
      };
      fetchData();
    }, [getAllMonthKeys, loadReportData])
  );

  // --- Data Processing & Table Generation (Memoized) ---

  const calculateTotals = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    reportData.forEach((item) => {
      totalGross += parseFloat(item.totalGrossIncome) || 0;
      totalNet += parseFloat(item.calculatedNetIncome) || 0;
    });
    return {
      totalGross: totalGross.toFixed(2),
      totalNet: totalNet.toFixed(2),
    };
  }, [reportData]);

  const tableHead = useMemo(() => {
    const staticHeaders = ["Date", "Gross Income", "Net Income"];
    const dynamicHeaderNames = new Set<string>();
    reportData.forEach((entry) => {
      (entry.all || []).forEach((item) => {
        if (item.name) dynamicHeaderNames.add(item.name);
      });
    });
    const dynamicHeaders = Array.from(dynamicHeaderNames).sort();
    return [...staticHeaders, ...dynamicHeaders];
  }, [reportData]);

  // Define FIXED column widths using widthArr
  const columnWidthArr = useMemo(() => {
    // ** ADJUST THESE WIDTHS AS NEEDED **
    const dateWidth = 90;
    const incomeWidth = 85;
    const dynamicWidth = 80; // Default width for dynamic columns

    const staticWidths = [dateWidth, incomeWidth, incomeWidth];
    const dynamicCount = tableHead.length - staticWidths.length;
    const dynamicWidths = Array(dynamicCount).fill(dynamicWidth);

    return [...staticWidths, ...dynamicWidths];
  }, [tableHead]); // Depends only on tableHead length

  const tableData = useMemo(() => {
    // ... (implementation remains the same) ...
    return reportData.map((item) => {
      const row: (string | number)[] = [
        item.todaysDate,
        (parseFloat(item.totalGrossIncome) || 0).toFixed(2),
        (parseFloat(item.calculatedNetIncome) || 0).toFixed(2),
      ];
      const itemMap = new Map<string, number>();
      (item.all || []).forEach((detail) => {
        if (detail.name)
          itemMap.set(detail.name, parseFloat(String(detail.value)) || 0);
      });
      tableHead.slice(3).forEach((header) => {
        row.push((itemMap.get(header) ?? 0).toFixed(2));
      });
      return row;
    });
  }, [reportData, tableHead]);

  const tableFoot = useMemo(() => {
    // ... (implementation remains the same) ...
    const staticFoot = [
      "Total",
      calculateTotals.totalGross,
      calculateTotals.totalNet,
    ];
    const dynamicTotals: string[] = [];
    tableHead.slice(3).forEach((header) => {
      let columnTotal = 0;
      reportData.forEach((item) => {
        const foundItem = (item.all || []).find(
          (allItem) => allItem.name === header
        );
        columnTotal += foundItem ? parseFloat(String(foundItem.value)) || 0 : 0;
      });
      dynamicTotals.push(columnTotal.toFixed(2));
    });
    return [...staticFoot, ...dynamicTotals];
  }, [reportData, tableHead, calculateTotals]);

  // --- HTML Generation & Printing ---
  const generateHTML = useCallback(() => {
    const currentMonth =
      reportData.length > 0 ? reportData[0].month : selectedMonthTitle;
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; } /* Removed table-layout fixed */
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; font-size: 10px; word-wrap: break-word; }
          th { background-color: #e9ecef; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          tfoot th { background-color: #dee2e6; }
          .month-title { font-size: 16px; text-align: center; color: #333; margin-bottom: 10px; font-weight: bold; }
          .print-header { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; margin-top: 20px; font-size: 9px; color: #777; }
        </style>
      </head>
      <body>
        <div class="print-header"><h2>Ecomoney Report</h2></div>
        <div class="month-title">Report of: ${currentMonth}</div>
        <table>
          <thead><tr>${tableHead
            .map((header) => `<th>${header}</th>`)
            .join("")}</tr></thead>
          <tbody>${tableData
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => `<td>${cell ?? ""}</td>`)
                  .join("")}</tr>`
            )
            .join("")}</tbody>
          <tfoot><tr>${tableFoot
            .map((footer) => `<th>${footer}</th>`)
            .join("")}</tr></tfoot>
        </table>
        <div class="print-footer">Generated on: ${new Date().toLocaleString()}</div>
      </body>
      </html>`;
    return html;
  }, [tableHead, tableData, tableFoot, reportData, selectedMonthTitle]); // Removed columnWidthArr dependency

  const printReport = async () => {
    if (reportData.length === 0) {
      ToastAndroid.show(
        "No data to print for the selected month",
        ToastAndroid.SHORT
      );
      return;
    }
    const html = generateHTML();
    try {
      const { uri } = await Print.printToFileAsync({
        html,
      });

      const fileName = `Ecomoney_Report_${selectedMonthTitle.replace(
        / /g,
        "_"
      )}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      await Sharing.shareAsync(newUri, {
        mimeType: "application/pdf",
        dialogTitle: `Share Report for ${selectedMonthTitle}`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("(Report.js) Error printing report:", error);
      ToastAndroid.show("Failed to print report", ToastAndroid.SHORT);
    }
  };

  const saveReportToDocuments = async () => {
    if (reportData.length === 0) {
      ToastAndroid.show(
        "No data to save for the selected month",
        ToastAndroid.SHORT
      );
      return;
    }

    if (Platform.OS === "android") {
      try {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const html = generateHTML();
          const { uri } = await Print.printToFileAsync({ html });
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const fileName = `Ecomoney_Report_${selectedMonthTitle.replace(
            / /g,
            "_"
          )}.pdf`;
          const mimeType = "application/pdf";

          const newFileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              mimeType
            );
          await FileSystem.writeAsStringAsync(newFileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          ToastAndroid.show("Report saved successfully", ToastAndroid.SHORT);
        } else {
          ToastAndroid.show("Permission denied", ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error("(Report.js) Error saving report:", error);
        ToastAndroid.show("Error saving report", ToastAndroid.SHORT);
      }
    } else {
      // For iOS, shareAsync is the standard way to save to files
      printReport();
    }
  };

  const handleMonthPress = useCallback(
    (month: string) => {
      loadReportData(month);
    },
    [loadReportData]
  );
  const renderMonthItem = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        onPress={() => handleMonthPress(item)}
        style={[
          styles.monthButton,
          item === selectedMonthTitle && styles.monthButtonSelected,
        ]}
      >
        <Text
          style={[
            styles.monthButtonText,
            item === selectedMonthTitle && styles.monthButtonTextSelected,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    ),
    [handleMonthPress, selectedMonthTitle]
  );

  const renderTableContent = () =>
    reportData.length > 0 ? (
      <ScrollView
        horizontal={true}
        contentContainerStyle={styles.tableOuterContainer}
      >
        <View>
          <Table borderStyle={styles.tableBorder}>
            {/* Use widthArr for column width distribution */}
            <Row
              data={tableHead}
              style={styles.head}
              textStyle={styles.headText}
              widthArr={columnWidthArr} // Use widthArr here
            />
            <Rows
              data={tableData}
              style={styles.row}
              textStyle={styles.rowText}
              widthArr={columnWidthArr} // Use widthArr here
            />
            <Row
              data={tableFoot}
              style={styles.foot}
              textStyle={styles.footText}
              widthArr={columnWidthArr} // Use widthArr here
            />
          </Table>
        </View>
      </ScrollView>
    ) : (
      <View style={styles.noDataContainer}>
        <Ionicons name="cloud-offline-outline" size={40} color="#adb5bd" />
        <Text style={styles.noDataText}>
          {selectedMonthTitle === "Select Month" ||
          selectedMonthTitle === "No Data Found"
            ? "Please select a month."
            : `No data available for ${selectedMonthTitle}.`}
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Month Selection Header */}
      <View style={styles.monthsHeader}>
        {allMonths.length > 0 ? (
          <FlatList
            horizontal={true}
            data={allMonths}
            renderItem={renderMonthItem}
            keyExtractor={(item) => `month-${item}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthsListContainer}
          />
        ) : (
          <Text style={styles.noMonthsText}>No historical data found</Text>
        )}
      </View>

      {/* Table Area */}
      <ScrollView
        style={styles.tableScrollView}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {renderTableContent()}
      </ScrollView>

      {/* Action Buttons Footer */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.printButton}
          onPress={printReport}
          disabled={reportData.length === 0}
        >
          <Ionicons
            name="share-social-outline"
            size={20}
            color={reportData.length === 0 ? "#adb5bd" : "white"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.printButtonText,
              reportData.length === 0 && styles.printButtonDisabledText,
            ]}
          >
            Share
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveReportToDocuments}
          disabled={reportData.length === 0}
        >
          <Ionicons
            name="save-outline"
            size={20}
            color={reportData.length === 0 ? "#adb5bd" : "white"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.printButtonText,
              reportData.length === 0 && styles.printButtonDisabledText,
            ]}
          >
            Save to Files
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  // Header
  monthsHeader: {
    height: 60,
    // backgroundColor: "#007bff",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    // elevation: 4,
    paddingHorizontal: 5,
  },
  monthsListContainer: {
    paddingBottom: 10,
    paddingHorizontal: 5,
    alignItems: "center",
  },
  monthButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 16,
    backgroundColor: "#495057",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    minHeight: 40,
  },
  monthButtonSelected: {
    backgroundColor: "#212529",
    borderColor: "#000",
    transform: [{ scale: 1.1 }],
  },
  monthButtonText: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 14,
  },
  monthButtonTextSelected: {
    color: "#f1f3f5",
    fontWeight: "bold",
    fontSize: 15,
  },
  noMonthsText: {
    color: "#e0e0e0",
    fontSize: 16,
  },
  // Title
  reportTitleStyle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#343a40",
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  // Table Area
  tableScrollView: {
    // Vertical scroll for the whole section below title
    flex: 1,
  },
  tableOuterContainer: {
    // Style for the horizontal scroll content
    paddingBottom: 10, // Add padding at the bottom if content gets cut off
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  // Table Cells
  head: {
    // height: 45, // Height is often determined by content + textStyle margins/padding when using widthArr
    backgroundColor: "#e9ecef",
  },
  headText: {
    margin: 8, // Increased margin slightly for padding
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 11,
    color: "#495057",
  },
  row: {
    // minHeight: 40, // Height is often determined by content + textStyle margins/padding
    backgroundColor: "#ffffff",
    // Example: Alternating row background
    // backgroundColor: index % 2 === 1 ? '#f8f9fa' : '#ffffff', // Needs index passed to style func
  },
  rowText: {
    margin: 8, // Increased margin slightly for padding
    textAlign: "center",
    fontSize: 10,
    color: "#212529",
  },
  foot: {
    // height: 40, // Height is often determined by content + textStyle margins/padding
    backgroundColor: "#dee2e6",
  },
  footText: {
    margin: 8, // Increased margin slightly for padding
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 11,
    color: "#212529",
  },
  // No Data Display
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 200,
  },
  noDataText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 10,
  },
  // Print Button
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#f8f9fa",
  },
  printButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  printButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  printButtonDisabledText: {
    color: "#adb5bd",
  },
});
