import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import uuid from "react-native-uuid";
import { useAuth } from "@/context/AuthContext";
import { useShift } from "@/context/ShiftContext";
import { useTheme } from "@/context/ThemeContext";
import { scanReceipt } from "@/services/ocrService";
import { compressReceiptImage } from "@/services/imageService";
import { checkDuplicateReference } from "@/services/duplicateCheck";
import { insertLocalTransaction } from "@/db/localLedger";
import { verifyReceiptTransfer, type VerificationResult } from "@/services/verificationService";
import type { ParsedReceipt } from "@/types";
import { formatCurrency } from "@/utils/format";

type Stage = "camera" | "processing" | "review" | "duplicate";

export function ScanScreen() {
  const { user } = useAuth();
  const { activeShiftId, startShift } = useShift();
  const { theme, colors, toggleTheme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<Stage>("camera");
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualRef, setManualRef] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  if (!permission) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permText, { color: colors.textSecondary }]}>Camera access is needed to scan receipts.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <LinearGradient colors={[colors.primary, '#8B0000']} style={styles.gradientBtn}>
            <Text style={styles.buttonText}>Grant permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || !user) return;
    setStage("processing");
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) {
        Alert.alert("Capture failed", "Could not capture receipt photo.");
        setStage("camera");
        return;
      }
      setCapturedUri(photo.uri);

      // OCR runs entirely on-device — no network round trip in this path.
      const result = await scanReceipt(photo.uri);
      setParsed(result);
      setManualAmount(result.amount != null ? String(result.amount) : "");
      setManualRef(result.referenceNumber ?? "");

      // 1. Verify Duplicate
      if (result.referenceNumber) {
        const dup = await checkDuplicateReference(user.orgId, result.referenceNumber);
        if (dup.isDuplicate) {
          setStage("duplicate");
          return;
        }
      }

      // 2. Strong Verification (Fake Receipt Check)
      const verifResult = await verifyReceiptTransfer(result);
      setVerification(verifResult);

      setStage("review");
    } catch (err) {
      Alert.alert("Scan failed", "Could not read this receipt. You can enter the details manually.");
      setStage("review");
    }
  }

  async function handleConfirm() {
    if (!user) return;
    const amount = Number(manualAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Amount required", "Enter a valid amount before saving.");
      return;
    }
    if (!manualRef.trim()) {
      Alert.alert("Reference required", "Enter the transaction reference number before saving.");
      return;
    }

    const dup = await checkDuplicateReference(user.orgId, manualRef.trim());
    if (dup.isDuplicate) {
      setStage("duplicate");
      return;
    }

    const shiftId = activeShiftId ?? (await startShift());
    const localId = uuid.v4() as string;
    const imageLocalPath = capturedUri ? await compressReceiptImage(capturedUri, localId) : null;

    // We can embed verification result locally so it syncs up.
    const isFlagged = verification?.status === "flagged";
    const flagReason = verification?.reason || null;

    await insertLocalTransaction({
      localId,
      orgId: user.orgId,
      waiterId: user.id,
      shiftId,
      tableNumber: tableNumber || null,
      amount,
      referenceNumber: manualRef.trim(),
      paymentProvider: parsed?.provider ?? "Unknown",
      senderName: parsed?.senderName ?? null,
      ocrRawText: parsed?.rawText ?? null,
      ocrConfidence: parsed?.confidence ?? null,
      imageLocalPath,
      syncStatus: isFlagged ? "error" : "pending", 
      syncError: isFlagged ? `FLAGGED: ${flagReason}` : null,
      capturedAt: new Date().toISOString(),
    });

    if (isFlagged) {
      Alert.alert("Transaction Flagged", `Saved, but marked as suspicious: ${flagReason}`);
    } else {
      Alert.alert("Saved", "Transaction securely verified and saved.");
    }
    resetToCamera();
  }

  function resetToCamera() {
    setStage("camera");
    setCapturedUri(null);
    setParsed(null);
    setManualAmount("");
    setManualRef("");
    setTableNumber("");
    setVerification(null);
  }

  if (stage === "camera" || stage === "processing") {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={(result) => {
             // In a robust implementation, a QR code scan directly skips OCR and extracts
             // the transaction details via a secure API lookup on CBE/Telebirr verification endpoints.
             console.log("Found QR: ", result.data);
          }}
        >
          {stage === "processing" ? (
            <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: "#fff", marginTop: 12, fontWeight: "600" }}>Verifying receipt digitally...</Text>
            </View>
          ) : (
            <View style={styles.overlay}>
              <View style={styles.headerRow}>
                 <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn}>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
                 </TouchableOpacity>
              </View>
              <View style={styles.captureButtonContainer}>
                <TouchableOpacity style={[styles.captureButton, { borderColor: colors.primary }]} onPress={handleCapture} />
              </View>
            </View>
          )}
        </CameraView>
      </View>
    );
  }

  if (stage === "duplicate") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.dupTitle}>Duplicate Detected</Text>
        <Text style={[styles.permText, { color: colors.textSecondary }]}>
          This reference number has already been submitted.
        </Text>
        <TouchableOpacity onPress={resetToCamera}>
          <LinearGradient colors={[colors.danger, '#8B0000']} style={styles.gradientBtn}>
            <Text style={styles.buttonText}>Scan another receipt</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // stage === "review"
  return (
    <View style={[styles.reviewContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.reviewTitle, { color: colors.text }]}>Confirm transaction</Text>

      {verification?.status === "flagged" && (
        <View style={[styles.verificationAlert, { backgroundColor: `${colors.danger}20`, borderColor: colors.danger }]}>
          <Text style={[styles.verifAlertText, { color: colors.danger }]}>
            ⚠️ FAKE RECEIPT WARNING: {verification.reason}
          </Text>
        </View>
      )}
      {verification?.status === "verified" && (
        <View style={[styles.verificationAlert, { backgroundColor: `${colors.success}20`, borderColor: colors.success }]}>
          <Text style={[styles.verifAlertText, { color: colors.success }]}>
            ✅ Verified digitally
          </Text>
        </View>
      )}

      <Text style={[styles.label, { color: colors.textSecondary }]}>Provider</Text>
      <Text style={[styles.reviewValue, { color: colors.text }]}>{parsed?.provider ?? "Unknown"}</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        keyboardType="decimal-pad"
        value={manualAmount}
        onChangeText={setManualAmount}
        placeholder="0.00"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Reference number</Text>
      <TextInput 
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
        value={manualRef} 
        onChangeText={setManualRef} 
        autoCapitalize="characters" 
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Table number (optional)</Text>
      <TextInput 
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
        value={tableNumber} 
        onChangeText={setTableNumber} 
        keyboardType="number-pad" 
      />

      {manualAmount ? (
        <Text style={[styles.previewAmount, { color: colors.success }]}>{formatCurrency(Number(manualAmount) || 0)}</Text>
      ) : null}

      <TouchableOpacity onPress={handleConfirm} style={{ marginTop: 24 }}>
        <LinearGradient colors={[colors.primary, '#8B0000']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.gradientBtn}>
          <Text style={styles.buttonText}>Save transaction</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={resetToCamera}>
        <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Retake photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0, top: 0,
    justifyContent: "space-between"
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 24,
    paddingTop: 50,
  },
  themeToggleBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 20,
  },
  captureButtonContainer: {
    paddingBottom: 40,
    alignItems: "center",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    borderWidth: 4,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  permText: { textAlign: "center", marginTop: 12, marginBottom: 20 },
  dupTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, color: '#E07856' },
  reviewContainer: { flex: 1, padding: 20, paddingTop: 40 },
  reviewTitle: { fontSize: 22, fontWeight: "800", marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 4, marginTop: 10 },
  reviewValue: { fontSize: 16, fontWeight: "700" },
  input: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  previewAmount: { fontSize: 28, fontWeight: "800", marginTop: 18, textAlign: "center" },
  gradientBtn: {
    borderRadius: 10, 
    paddingVertical: 15, 
    alignItems: "center", 
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryButton: { alignItems: "center", marginTop: 14 },
  secondaryButtonText: { fontWeight: "600" },
  verificationAlert: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  verifAlertText: {
    fontWeight: "700",
    fontSize: 14,
  }
});
