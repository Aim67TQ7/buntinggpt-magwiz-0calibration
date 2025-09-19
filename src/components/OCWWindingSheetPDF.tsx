import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

interface OCWData {
  prefix?: number;
  suffix?: number;
  filename: string;
  magnet_dimension?: string;
  winding_dimension?: string;
  diameter?: number;
  number_of_turns?: string;
  wires_in_parallel?: number;
  voltage_A?: number;
  voltage_B?: number;
  voltage_C?: number;
  cold_current_A?: number;
  cold_current_B?: number;
  cold_current_C?: number;
  resistance_A?: number;
  resistance_B?: number;
  resistance_C?: number;
  core_mass?: number;
  winding_mass?: number;
  total_mass?: number;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 15,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  leftColumn: {
    flex: 1,
    marginRight: 6,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 6,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    minHeight: 18,
    alignItems: 'center',
  },
  tableColHeader: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    backgroundColor: '#f0f0f0',
    padding: 3,
    fontWeight: 'bold',
  },
  tableCol: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    padding: 3,
  },
  lastCol: {
    width: '50%',
    padding: 3,
  },
  bold: {
    fontWeight: 'bold',
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  footer: {
    marginTop: 10,
    fontSize: 7,
    textAlign: 'center',
  },
});

interface OCWWindingSheetPDFProps {
  data: OCWData;
}

const OCWWindingSheetPDF: React.FC<OCWWindingSheetPDFProps> = ({ data }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <Text style={styles.header}>
        Winding Sheet for {data.prefix || 'N/A'} OCW {data.suffix || 'N/A'}
      </Text>
      
      <Text style={styles.footer}>
        {new Date().toLocaleDateString('en-GB')}
      </Text>

      {/* Top Section - Conductor Information - Two Columns */}
      <View style={styles.row}>
        <View style={styles.leftColumn}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Conductor Material</Text>
              <Text style={styles.tableCol}>{data.winding_dimension || 'Aluminium'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Conductor Insulation</Text>
              <Text style={styles.tableCol}>Nomex</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>No. of Coils</Text>
              <Text style={styles.lastCol}>1</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Wires in Parallel</Text>
              <Text style={styles.lastCol}>{data.wires_in_parallel || 'N/A'}</Text>
            </View>
          </View>

          {/* Electrical Values Table */}
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Volts</Text>
              <Text style={styles.tableColHeader}>Amps</Text>
              <Text style={styles.tableColHeader}>Ohms</Text>
              <Text style={styles.tableColHeader}>Per Coil</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>{data.voltage_A || 'N/A'}</Text>
              <Text style={styles.tableCol}>{data.cold_current_A?.toFixed(2) || 'N/A'}</Text>
              <Text style={styles.tableCol}>{data.resistance_A?.toFixed(4) || 'N/A'}</Text>
              <Text style={styles.lastCol}></Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}></Text>
              <Text style={styles.tableCol}></Text>
              <Text style={styles.tableCol}></Text>
              <Text style={styles.tableColHeader}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Size</Text>
              <Text style={styles.tableCol}>{data.diameter || 'N/A'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Weight</Text>
              <Text style={styles.tableCol}>{data.winding_mass || 'N/A'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Number of Turns</Text>
              <Text style={styles.tableCol}>{data.number_of_turns || 'N/A'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Wound on Core</Text>
              <Text style={styles.lastCol}>Yes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Test Section */}
      <View style={styles.section}>
        <Text style={styles.title}>Test - Continuous 8 hours minimum or until current remains constant for 3 hours</Text>
        
        <View style={styles.row}>
          {/* First Table */}
          <View style={styles.leftColumn}>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableColHeader}>Time</Text>
                <Text style={styles.tableColHeader}>Hrs</Text>
                <Text style={styles.tableColHeader}>Volts</Text>
                <Text style={styles.tableColHeader}>Amps</Text>
                <Text style={styles.tableColHeader}>Amb °C</Text>
              </View>
              
              {[0, 1, 2, 3, 4, 5].map((hour) => (
                <View key={hour} style={styles.tableRow}>
                  <Text style={styles.tableCol}></Text>
                  <Text style={styles.tableCol}>{hour}</Text>
                  <Text style={styles.tableCol}></Text>
                  <Text style={styles.tableCol}></Text>
                  <Text style={styles.lastCol}></Text>
                </View>
              ))}
            </View>
          </View>

          {/* Second Table */}
          <View style={styles.rightColumn}>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableColHeader}>Time</Text>
                <Text style={styles.tableColHeader}>Hrs</Text>
                <Text style={styles.tableColHeader}>Volts</Text>
                <Text style={styles.tableColHeader}>Amps</Text>
                <Text style={styles.tableColHeader}>Amb °C</Text>
              </View>
              
              {[6, 7, 8, 9, 10, 11].map((hour) => (
                <View key={hour} style={styles.tableRow}>
                  <Text style={styles.tableCol}></Text>
                  <Text style={styles.tableCol}>{hour}</Text>
                  <Text style={styles.tableCol}></Text>
                  <Text style={styles.tableCol}></Text>
                  <Text style={styles.lastCol}></Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Section - Test Results */}
      <View style={styles.section}>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Actual Turns</Text>
            <Text style={styles.lastCol}></Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Prior to Test Resistance to Earth</Text>
            <Text style={styles.tableCol}>MΩ</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>After Test Resistance to Earth</Text>
            <Text style={styles.tableCol}>MΩ</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Temperature Rise by Resistance</Text>
            <Text style={styles.tableCol}>°C</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Insulation Type</Text>
            <Text style={styles.tableCol}>Class</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Passed by Works</Text>
            <Text style={styles.tableCol}>Date</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Checked & Passed by Office</Text>
            <Text style={styles.tableCol}>Date</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Gauss Test</Text>
            <Text style={styles.tableCol}>Yes/No</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Unit Weight</Text>
            <Text style={styles.tableCol}>Kgs</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Winding Hours</Text>
            <Text style={styles.lastCol}></Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Nomex Used</Text>
            <Text style={styles.lastCol}>M</Text>
          </View>
        </View>
      </View>

      {/* Special Instructions */}
      <View style={styles.section}>
        <Text style={styles.title}>Special Instructions</Text>
        <View style={{ border: '1px solid #000', height: 30, padding: 3 }}></View>
      </View>

      <Text style={styles.footer}>
        Generated from OCW Configuration Database - {data.filename}
      </Text>
    </Page>
  </Document>
);

export const downloadOCWWindingSheet = async (data: OCWData) => {
  const blob = await pdf(<OCWWindingSheetPDF data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `OCW_${data.prefix || 'N_A'}_${data.suffix || 'N_A'}_Winding_Sheet.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default OCWWindingSheetPDF;