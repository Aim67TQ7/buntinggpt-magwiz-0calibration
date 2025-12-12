import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';

interface GaussTableRow {
  gap: number;
  gauss20: number;
  gauss30: number;
  gauss40: number;
  gauss45: number;
  ff20: number;
  ff30: number;
  ff40: number;
  ff45: number;
}

interface GaussTablePDFProps {
  unit: {
    Prefix: number;
    Suffix: number;
    surface_gauss: number;
    force_factor: number;
    watts: number;
    width: number;
    frame: string;
  };
  tableData: GaussTableRow[];
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  logo: {
    width: 120,
    height: 40,
    marginRight: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryBox: {
    flex: 1,
    padding: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 4,
  },
  summaryLabel: {
    fontSize: 7,
    color: '#666',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 14,
    alignItems: 'center',
  },
  tableSubHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 12,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    minHeight: 11,
    alignItems: 'center',
  },
  tableRowHighlight: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    minHeight: 11,
    alignItems: 'center',
    backgroundColor: '#e8f4e8',
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 11,
    alignItems: 'center',
  },
  cellGap: {
    width: '8%',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
    padding: 2,
    fontSize: 7,
    fontWeight: 'bold',
  },
  cellHeaderGroup: {
    width: '23%',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
    padding: 2,
    fontSize: 8,
    fontWeight: 'bold',
  },
  cellHeaderGroupLast: {
    width: '23%',
    textAlign: 'center',
    padding: 2,
    fontSize: 8,
    fontWeight: 'bold',
  },
  cellSubHeader: {
    width: '11.5%',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    padding: 1,
    fontSize: 6,
  },
  cellSubHeaderLast: {
    width: '11.5%',
    textAlign: 'center',
    padding: 1,
    fontSize: 6,
  },
  cellData: {
    width: '11.5%',
    textAlign: 'right',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    padding: 2,
    fontSize: 6,
  },
  cellDataLast: {
    width: '11.5%',
    textAlign: 'right',
    padding: 2,
    fontSize: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#666',
  },
  pageNumber: {
    fontSize: 7,
    color: '#666',
  },
});

const ROWS_PER_PAGE = 28;

const GaussTablePDF: React.FC<GaussTablePDFProps> = ({ unit, tableData }) => {
  const totalPages = Math.ceil(tableData.length / ROWS_PER_PAGE);
  const pages: GaussTableRow[][] = [];
  
  for (let i = 0; i < tableData.length; i += ROWS_PER_PAGE) {
    pages.push(tableData.slice(i, i + ROWS_PER_PAGE));
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <Document>
      {pages.map((pageData, pageIndex) => (
        <Page key={pageIndex} size="LETTER" style={styles.page}>
          {/* Header with Logo */}
          <View style={styles.headerContainer}>
            <Image style={styles.logo} src="/bunting-logo.png" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.header}>GAUSS & FORCE FACTOR TABLE</Text>
              <Text style={styles.subheader}>
                Model: {unit.Prefix} OCW {unit.Suffix} | Date: {new Date().toLocaleDateString('en-US')}
              </Text>
            </View>
          </View>

          {/* Only show summary on first page */}
          {pageIndex === 0 && (
            <>
              {/* Surface Values Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SURFACE VALUES (Gap = 0mm)</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Surface Gauss</Text>
                    <Text style={styles.summaryValue}>{unit.surface_gauss?.toLocaleString()} G</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Force Factor</Text>
                    <Text style={styles.summaryValue}>{unit.force_factor?.toLocaleString()} N</Text>
                  </View>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Watts</Text>
                    <Text style={styles.summaryValue}>{unit.watts?.toLocaleString()} W</Text>
                  </View>
                  <View style={[styles.summaryBox, { marginRight: 0 }]}>
                    <Text style={styles.summaryLabel}>Width</Text>
                    <Text style={styles.summaryValue}>{unit.width?.toLocaleString()} mm</Text>
                  </View>
                </View>
              </View>

            </>
          )}

          {/* Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {pageIndex === 0 ? 'GAUSS & FORCE FACTOR AT DISTANCE' : `GAUSS & FORCE FACTOR AT DISTANCE (continued)`}
            </Text>
            <View style={styles.table}>
              {/* Main header row */}
              <View style={styles.tableHeaderRow}>
                <Text style={styles.cellGap}>Gap</Text>
                <Text style={styles.cellHeaderGroup}>A20</Text>
                <Text style={styles.cellHeaderGroup}>A30</Text>
                <Text style={styles.cellHeaderGroup}>A40</Text>
                <Text style={styles.cellHeaderGroupLast}>A45</Text>
              </View>
              
              {/* Sub header row */}
              <View style={styles.tableSubHeaderRow}>
                <Text style={styles.cellGap}>(mm)</Text>
                <Text style={styles.cellSubHeader}>Gauss</Text>
                <Text style={styles.cellSubHeader}>FF</Text>
                <Text style={styles.cellSubHeader}>Gauss</Text>
                <Text style={styles.cellSubHeader}>FF</Text>
                <Text style={styles.cellSubHeader}>Gauss</Text>
                <Text style={styles.cellSubHeader}>FF</Text>
                <Text style={styles.cellSubHeader}>Gauss</Text>
                <Text style={styles.cellSubHeaderLast}>FF</Text>
              </View>

              {/* Data rows */}
              {pageData.map((row, rowIndex) => {
                const isLast = rowIndex === pageData.length - 1;
                const isHighlight = row.gap === 0;
                const RowStyle = isHighlight ? styles.tableRowHighlight : (isLast ? styles.tableRowLast : styles.tableRow);
                
                return (
                  <View key={row.gap} style={RowStyle}>
                    <Text style={styles.cellGap}>{row.gap}</Text>
                    <Text style={styles.cellData}>{row.gauss20.toLocaleString()}</Text>
                    <Text style={styles.cellData}>{formatNumber(row.ff20)}</Text>
                    <Text style={styles.cellData}>{row.gauss30.toLocaleString()}</Text>
                    <Text style={styles.cellData}>{formatNumber(row.ff30)}</Text>
                    <Text style={styles.cellData}>{row.gauss40.toLocaleString()}</Text>
                    <Text style={styles.cellData}>{formatNumber(row.ff40)}</Text>
                    <Text style={styles.cellData}>{row.gauss45.toLocaleString()}</Text>
                    <Text style={styles.cellDataLast}>{formatNumber(row.ff45)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text>Generated from OCW Configuration Database | Bunting Magnetics Co.</Text>
            <Text style={styles.pageNumber}>Page {pageIndex + 1} of {totalPages}</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export const downloadGaussTablePDF = async (
  unit: GaussTablePDFProps['unit'],
  tableData: GaussTableRow[]
) => {
  const blob = await pdf(<GaussTablePDF unit={unit} tableData={tableData} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gauss-table-${unit.Prefix}-OCW-${unit.Suffix}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default GaussTablePDF;
