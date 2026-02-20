import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from "date-fns";
import path from "path";

const isBrowser = typeof window !== "undefined";

// Use root-relative URL for browser, absolute path for server
const getFontSource = (fontName: string) => {
    if (isBrowser) {
        return `/fonts/${fontName}`;
    }
    return path.join(process.cwd(), "public", "fonts", fontName).replace(/\\/g, "/");
};

Font.register({
    family: "Montserrat-V2",
    fonts: [
        { src: getFontSource("Montserrat-Regular.ttf") },
        { src: getFontSource("Montserrat-Bold.ttf"), fontWeight: "bold" },
        { src: getFontSource("Montserrat-ExtraBold.ttf"), fontWeight: "heavy" },
    ],
});

Font.register({
    family: "SpaceGrotesk-V2",
    fonts: [
        { src: getFontSource("SpaceGrotesk-Regular.ttf") },
        { src: getFontSource("SpaceGrotesk-Bold.ttf"), fontWeight: "bold" },
    ],
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "SpaceGrotesk-V2",
        color: "#000000",
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 40,
        borderBottomWidth: 2,
        borderBottomColor: "#000000",
        paddingBottom: 20,
    },
    brandSection: {
        flexDirection: "column",
    },
    brandName: {
        fontSize: 26,
        fontFamily: "Montserrat-V2",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    brandSub: {
        fontSize: 9,
        fontFamily: "Montserrat-V2",
        textTransform: "uppercase",
        letterSpacing: 2,
        color: "#4b5563",
    },
    reportDetails: {
        textAlign: "right",
    },
    reportTitle: {
        fontSize: 18,
        fontFamily: "Montserrat-V2",
        fontWeight: "bold",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    reportSub: {
        fontSize: 10,
        fontFamily: "Montserrat-V2",
        color: "#6b7280",
        marginBottom: 2,
    },
    date: {
        fontSize: 10,
        fontFamily: "Montserrat-V2",
        color: "#6b7280",
    },
    table: {
        width: "100%",
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 2,
        borderBottomColor: "#000000",
        paddingBottom: 8,
        marginBottom: 8,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        paddingVertical: 8,
    },
    th: {
        fontSize: 9,
        fontFamily: "Montserrat-V2",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    td: {
        fontSize: 10,
        fontFamily: "Montserrat-V2",
    },
    footerContainer: {
        marginTop: "auto",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 20,
    },
    footerText: {
        fontSize: 8,
        fontFamily: "Montserrat-V2",
        color: "#6b7280",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 2,
    }
});

export const ReportDocument = ({ title, dateRange, headers, data }: {
    title: string,
    dateRange: string,
    headers: string[],
    data: any[][]
}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.brandSection}>
                    <Text style={styles.brandName}>WoodLedger</Text>
                    <Text style={styles.brandSub}>Premium Furniture</Text>
                </View>
                <View style={styles.reportDetails}>
                    <Text style={styles.reportTitle}>{title}</Text>
                    <Text style={styles.reportSub}>Range: {dateRange}</Text>
                    <Text style={styles.date}>Generated: {format(new Date(), "MMMM dd, yyyy")}</Text>
                </View>
            </View>

            {/* Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    {headers.map((header, i) => (
                        <Text key={i} style={[styles.th, { width: `${100 / headers.length}%`, textAlign: i === headers.length - 1 ? 'right' : 'left' }]}>
                            {header}
                        </Text>
                    ))}
                </View>
                {data.map((row, i) => (
                    <View key={i} style={styles.tableRow}>
                        {row.map((cell, j) => (
                            <Text key={j} style={[styles.td, {
                                width: `${100 / headers.length}%`,
                                textAlign: j === headers.length - 1 ? 'right' : 'left',
                                fontFamily: j === 0 ? "Montserrat-V2" : "SpaceGrotesk-V2",
                                fontWeight: j === 0 ? "bold" : "normal"
                            }]}>
                                {cell}
                            </Text>
                        ))}
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                    &copy; {new Date().getFullYear()} WoodLedger Business Dashboard • Confidential Business Report
                </Text>
            </View>
        </Page>
    </Document>
);
