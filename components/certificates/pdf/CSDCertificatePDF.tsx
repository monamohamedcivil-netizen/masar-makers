import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { CertificateViewModel } from "@/lib/certificates";

type Props = {
  certificate: CertificateViewModel;
  templateDataUrl: string;
  qrCodeDataUrl: string;
};

export default function CSDCertificatePDF({
  certificate,
  templateDataUrl,
  qrCodeDataUrl,
}: Props) {
  return (
    <Document
      title={`Certificate-${certificate.certificateNumber}`}
      author="Masar Makers"
      subject={certificate.courseTitleEn || certificate.courseTitle}
      creator="Masar Makers"
    >
      <Page
        size="A4"
        orientation="landscape"
        style={styles.page}
      >
        <Image
          src={templateDataUrl}
          style={styles.background}
        />

        <View style={styles.studentNameContainer}>
          <Text style={styles.studentName}>
            {certificate.studentNameEn ||
              certificate.studentName}
          </Text>
        </View>

        <Text style={styles.certificateNumber}>
          {certificate.certificateNumber}
        </Text>

        <View style={styles.verificationContainer}>
          <Text style={styles.verificationText}>
            Verify this certificate by scanning the QR Code
          </Text>

          <Text style={styles.verificationCode}>
            {certificate.verificationCode}
          </Text>
        </View>

        <View style={styles.qrContainer}>
          <Image
            src={qrCodeDataUrl}
            style={styles.qrCode}
          />
        </View>
      </Page>
    </Document>
  );
}

const styles = StyleSheet.create({
  page: {
    position: "relative",
    backgroundColor: "#FFFFFF",
  },

  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },

  studentNameContainer: {
    position: "absolute",
    top: "34.8%",
    left: "11%",
    width: "78%",
    height: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  studentName: {
    fontSize: 34,
    fontWeight: 700,
    color: "#07152E",
    textAlign: "center",
  },

  certificateNumber: {
    position: "absolute",
    left: "3.5%",
    bottom: "3%",
    fontSize: 11,
    fontWeight: 700,
    color: "#07152E",
    letterSpacing: 0.4,
  },

  verificationContainer: {
    position: "absolute",
    right: "3.5%",
    bottom: "17%",
    width: 145,
    alignItems: "flex-end",
  },

  verificationText: {
    fontSize: 7,
    lineHeight: 1.4,
    fontWeight: 700,
    color: "#07152E",
    textAlign: "right",
  },

  verificationCode: {
    marginTop: 4,
    fontSize: 5.5,
    lineHeight: 1.3,
    color: "#475569",
    textAlign: "right",
  },

  qrContainer: {
    position: "absolute",
    right: "3.6%",
    bottom: "3.4%",
    width: 72,
    height: 72,
    padding: 4,
    backgroundColor: "#FFFFFF",
  },

  qrCode: {
    width: "100%",
    height: "100%",
  },
});