import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
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
        fontFamily: "SpaceGrotesk-V2", // Default to SpaceGrotesk for data/numbers? Or Montserrat? Print uses font-sans (Montserrat) as root.
        // Let's switch root to Montserrat to match print-container font-sans
        // But keep variables for specific uses
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
        fontSize: 26, // ~text-4xl
        fontFamily: "Montserrat-V2",
        fontWeight: "bold", // heavy might be too thick compared to Tailwind bold
        textTransform: "uppercase",
        letterSpacing: -0.5, // tracking-tight
        marginBottom: 4,
    },
    brandSub: {
        fontSize: 9, // text-sm
        fontFamily: "Montserrat-V2",
        textTransform: "uppercase",
        letterSpacing: 2, // tracking-widest
        color: "#4b5563", // text-gray-600
    },
    invoiceDetails: {
        textAlign: "right",
    },
    invoiceTitle: {
        fontSize: 18, // text-2xl
        fontFamily: "Montserrat-V2",
        fontWeight: "bold",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    invoiceNumber: {
        fontSize: 12, // text-lg
        fontFamily: "SpaceGrotesk-V2", // font-mono
        marginBottom: 4,
        color: "#4b5563", // text-gray-600
    },
    date: {
        fontSize: 10, // text-sm
        fontFamily: "Montserrat-V2", // default sans
        color: "#6b7280", // text-gray-500
    },
    gridTwo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 40,
        gap: 40,
    },
    column: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 9, // text-xs
        fontFamily: "Montserrat-V2",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 2, // tracking-widest
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb", // border-gray-200
        paddingBottom: 4,
        marginBottom: 10,
        color: "#6b7280", // text-gray-500
    },
    detailRow: {
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 11, // text-lg for name, medium for others?
        fontFamily: "Montserrat-V2",
        fontWeight: "bold",
        marginBottom: 2,
    },
    detailLabel: {
        fontSize: 9,
        fontFamily: "Montserrat-V2",
        color: "#4b5563", // text-gray-600
        marginBottom: 1,
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
        borderBottomColor: "#e5e7eb", // divide-gray-200
        paddingVertical: 8,
    },
    th: {
        fontSize: 9, // text-xs
        fontFamily: "Montserrat-V2",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 0.5, // tracking-wider
    },
    td: {
        fontSize: 10,
        fontFamily: "Montserrat-V2", // Default for item names
    },
    colItem: { width: "45%" },
    colQty: { width: "15%", textAlign: "right", fontFamily: "SpaceGrotesk-V2" }, // font-mono
    colPrice: { width: "20%", textAlign: "right", fontFamily: "SpaceGrotesk-V2" }, // font-mono
    colTotal: { width: "20%", textAlign: "right", fontFamily: "SpaceGrotesk-V2", fontWeight: "bold" }, // font-mono bold

    footerSection: {
        marginTop: "auto",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 20,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    totalsContainer: {
        width: "40%",
        marginLeft: "auto",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 9,
        fontFamily: "Montserrat-V2",
        textTransform: "uppercase",
        color: "#6b7280", // text-gray-500
        letterSpacing: 0.5,
    },
    totalValue: {
        fontSize: 12, // text-lg
        fontFamily: "SpaceGrotesk-V2", // font-mono
        fontWeight: "bold",
        textAlign: "right",
    },
    grandTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: "#000000",
    },
    grandTotalLabel: {
        fontSize: 12, // text-sm
        fontFamily: "Montserrat-V2",
        fontWeight: "bold", // font-black
        textTransform: "uppercase",
    },
    grandTotalValue: {
        fontSize: 18, // text-2xl
        fontFamily: "SpaceGrotesk-V2", // font-mono
        fontWeight: "bold", // font-black
    },
    footerText: {
        fontSize: 8, // text-xs
        fontFamily: "Montserrat-V2",
        color: "#6b7280", // text-gray-500
        textAlign: "center",
        marginTop: 40,
        textTransform: "uppercase",
        letterSpacing: 2, // tracking-widest
    }
});

interface InvoiceTemplateProps {
    order: any;
    client: any;
    items: any[];
}

export const InvoiceTemplate = ({ order, client, items }: InvoiceTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.brandSection}>
                    <Text style={styles.brandName}>WoodLedger</Text>
                    <Text style={styles.brandSub}>Premium Furniture</Text>
                </View>
                <View style={styles.invoiceDetails}>
                    <Text style={styles.invoiceTitle}>Invoice</Text>
                    <Text style={styles.invoiceNumber}>#{order.orderNumber}</Text>
                    <Text style={styles.date}>{format(new Date(order.createdAt), "MMMM dd, yyyy")}</Text>
                </View>
            </View>

            {/* Client & Info Grid */}
            <View style={styles.gridTwo}>
                <View style={styles.column}>
                    <Text style={styles.sectionTitle}>Bill To</Text>
                    <Text style={[styles.detailValue, { fontSize: 12 }]}>{client.name}</Text>
                    <Text style={[styles.detailValue, { fontWeight: "normal", fontSize: 10 }]}>{client.phone}</Text>
                    <Text style={[styles.detailValue, { fontWeight: "normal", fontSize: 10 }]}>{client.address || "N/A"}</Text>
                </View>
                <View style={[styles.column, { alignItems: "flex-end" }]}>
                    <Text style={[styles.sectionTitle, { textAlign: "right", width: "100%" }]}>Delivery Details</Text>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.detailLabel}>Estimated Delivery</Text>
                        <Text style={[styles.detailValue, { fontSize: 10 }]}>
                            {format(new Date(order.deliveryDate), "PPP")}
                        </Text>
                    </View>
                    {order.notes && (
                        <View style={{ marginTop: 10, maxWidth: 200, alignItems: "flex-end" }}>
                            <Text style={styles.detailLabel}>Notes</Text>
                            <Text style={[styles.detailValue, { textAlign: "right", fontWeight: "normal", color: "#4b5563", fontSize: 9 }]}>
                                {order.notes}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.colItem]}>Item Details</Text>
                    <Text style={[styles.th, styles.colQty]}>Qty</Text>
                    <Text style={[styles.th, styles.colPrice]}>Unit Price</Text>
                    <Text style={[styles.th, styles.colTotal]}>Amount</Text>
                </View>
                {items.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                        <View style={styles.colItem}>
                            <Text style={{ fontFamily: "Montserrat-V2", fontWeight: "bold", fontSize: 10 }}>{item.furnitureType.name}</Text>
                            <Text style={{ fontFamily: "Montserrat-V2", fontSize: 9, color: "#4b5563" }}>
                                {item.fabricTypes?.map((ft: any) => ft.name).join(", ") || "N/A"}
                            </Text>
                            {/* Notes might trigger italic, but font support depends heavily on loading italic variant */}
                            {item.notes && <Text style={{ fontFamily: "Montserrat-V2", fontSize: 8, color: "#6b7280", marginTop: 2 }}>{item.notes}</Text>}
                        </View>
                        <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                        <Text style={[styles.td, styles.colPrice]}>Rs. {Number(item.price).toLocaleString()}</Text>
                        <Text style={[styles.td, styles.colTotal]}>
                            Rs. {(item.quantity * Number(item.price)).toLocaleString()}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsContainer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalValue}>Rs. {Number(order.totalPrice).toLocaleString()}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Advance Paid</Text>
                    <Text style={styles.totalValue}>- Rs. {Number(order.advancePayment).toLocaleString()}</Text>
                </View>
                <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalLabel}>Balance Due</Text>
                    <Text style={styles.grandTotalValue}>
                        Rs. {(Number(order.totalPrice) - Number(order.advancePayment)).toLocaleString()}
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
                &copy; {new Date().getFullYear()} WoodLedger Furniture. Thank you for your business.
            </Text>
        </Page>
    </Document>
);
