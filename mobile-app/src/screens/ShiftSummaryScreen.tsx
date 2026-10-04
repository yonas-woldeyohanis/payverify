import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { useShift } from "@/context/ShiftContext";
import { getShiftSummary } from "@/db/localLedger";
import { supabase } from "@/config/supabase";
import { formatCurrency } from "@/utils/format";
import type { ShiftSummary } from "@/types";

export function ShiftSummaryScreen() {
  const { user } = useAuth();
  const { activeShiftId, endShiftLocally } = useShift();
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [cashTotal, setCashTotal] = useState("");
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    if (!activeShiftId) {
      setSummary(null);
      return;
    }
    const s = await getShiftSummary(activeShiftId, Number(cashTotal) || 0);
    setSummary(s);
  }, [activeShiftId, cashTotal]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCloseShift() {
    if (!activeShiftId || !user) return;
    setClosing(true);
    try {
      const { error } = await supabase.rpc("close_shift", {
        p_shift_id: activeShiftId,
        p_closed_by: user.id,
        p_reported_cash: Number(cashTotal) || 0,
        p_notes: null,
      });
      if (error) throw error;
      Alert.alert("Shift closed", "Your shift has been submitted for manager reconciliation.");
      endShiftLocally();
      setCashTotal("");
    } catch (err: any) {
      Alert.alert(
        "Could not close shift yet",
        "You may be offline — pending transactions will sync automatically and you can retry closing then."
      );
    } finally {
      setClosing(false);
    }
  }

  if (!activeShiftId || !summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No active shift yet. Scan a receipt to start one.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Shift summary</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Mobile transfers (this device)</Text>
        <Text style={styles.totalAmount}>{formatCurrency(summary.mobileTotal)}</Text>
        <Text style={styles.totalSub}>{summary.transactionCount} transactions</Text>
      </View>

      <Text style={styles.sectionTitle}>By provider</Text>
      {Object.entries(summary.byProvider).map(([provider, amount]) => (
        <View key={provider} style={styles.providerRow}>
          <Text style={styles.providerName}>{provider}</Text>
          <Text style={styles.providerAmount}>{formatCurrency(amount)}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Cash counted</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="0.00"
        value={cashTotal}
        onChangeText={setCashTotal}
      />

      <TouchableOpacity
        style={[styles.button, closing && { opacity: 0.6 }]}
        onPress={handleCloseShift}
        disabled={closing}
      >
        <Text style={styles.buttonText}>{closing ? "Closing..." : "Close shift & submit for audit"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F5F0" },
  center: { flex: 1, backgroundColor: "#F7F5F0", justifyContent: "center", alignItems: "center", padding: 24 },
  emptyText: { color: "#5B6472", textAlign: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#14181F", marginBottom: 16 },
  totalCard: { backgroundColor: "#1F4B3F", borderRadius: 14, padding: 20, marginBottom: 20 },
  totalLabel: { color: "#CFE0D8", fontSize: 13, fontWeight: "600" },
  totalAmount: { color: "#fff", fontSize: 34, fontWeight: "800", marginTop: 4 },
  totalSub: { color: "#CFE0D8", fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#14181F", marginTop: 12, marginBottom: 8 },
  providerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E7E3D9",
  },
  providerName: { color: "#14181F", fontWeight: "600" },
  providerAmount: { color: "#14181F", fontWeight: "700" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E7E3D9",
    fontSize: 16,
  },
  button: { backgroundColor: "#B8863C", borderRadius: 10, paddingVertical: 15, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#14181F", fontWeight: "700", fontSize: 16 },
});
