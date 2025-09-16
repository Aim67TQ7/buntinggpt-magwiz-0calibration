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
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  leftColumn: {
    flex: 1,
    marginRight: 10,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 10,
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
    minHeight: 25,
    alignItems: 'center',
  },
  tableColHeader: {
    width: '25%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    backgroundColor: '#f0f0f0',
    padding: 5,
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    padding: 5,
  },
  lastCol: {
    width: '25%',
    padding: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footer: {
    marginTop: 20,
    fontSize: 8,
    textAlign: 'center',
  },
});

interface OCWWindingSheetPDFProps {
  data: OCWData;
}

const OCWWindingSheetPDF: React.FC<OCWWindingSheetPDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <Text style={styles.header}>
        Winding Sheet for {data.prefix || 'N/A'} OCW {data.suffix || 'N/A'}
      </Text>
      
      <Text style={styles.footer}>
        Date: {new Date().toLocaleDateString()}
      </Text>

      {/* Basic Information Section */}
      <View style={styles.row}>
        <View style={styles.leftColumn}>
          <Text style={styles.title}>Conductor Information</Text>
          <Text>Material: {data.winding_dimension || 'N/A'}</Text>
          <Text>Diameter: {data.diameter || 'N/A'} mm</Text>
          <Text>Parallel Wires: {data.wires_in_parallel || 'N/A'}</Text>
          <Text>Number of Turns: {data.number_of_turns || 'N/A'}</Text>
        </View>
        
        <View style={styles.rightColumn}>
          <Text style={styles.title}>Specifications</Text>
          <Text>Magnet Dimension: {data.magnet_dimension || 'N/A'}</Text>
          <Text>Core Mass: {data.core_mass || 'N/A'} kg</Text>
          <Text>Winding Mass: {data.winding_mass || 'N/A'} kg</Text>
          <Text>Total Mass: {data.total_mass || 'N/A'} kg</Text>
        </View>
      </View>

      {/* Electrical Data Table */}
      <View style={styles.section}>
        <Text style={styles.title}>Electrical Characteristics</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Phase</Text>
            <Text style={styles.tableColHeader}>Volts</Text>
            <Text style={styles.tableColHeader}>Amps</Text>
            <Text style={styles.lastCol}>Ohms</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>A</Text>
            <Text style={styles.tableCol}>{data.voltage_A || 'N/A'}</Text>
            <Text style={styles.tableCol}>{data.cold_current_A?.toFixed(2) || 'N/A'}</Text>
            <Text style={styles.lastCol}>{data.resistance_A?.toFixed(4) || 'N/A'}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>B</Text>
            <Text style={styles.tableCol}>{data.voltage_B || 'N/A'}</Text>
            <Text style={styles.tableCol}>{data.cold_current_B?.toFixed(2) || 'N/A'}</Text>
            <Text style={styles.lastCol}>{data.resistance_B?.toFixed(4) || 'N/A'}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCol}>C</Text>
            <Text style={styles.tableCol}>{data.voltage_C || 'N/A'}</Text>
            <Text style={styles.tableCol}>{data.cold_current_C?.toFixed(2) || 'N/A'}</Text>
            <Text style={styles.lastCol}>{data.resistance_C?.toFixed(4) || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Test Data Section (Empty Template) */}
      <View style={styles.section}>
        <Text style={styles.title}>Test Data (To be filled manually)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Time</Text>
            <Text style={styles.tableColHeader}>Hrs</Text>
            <Text style={styles.tableColHeader}>Volts</Text>
            <Text style={styles.tableColHeader}>Amps</Text>
            <Text style={styles.lastCol}>Amb °C</Text>
          </View>
          
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCol}></Text>
              <Text style={styles.tableCol}></Text>
              <Text style={styles.tableCol}></Text>
              <Text style={styles.tableCol}></Text>
              <Text style={styles.lastCol}></Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer Information */}
      <View style={styles.section}>
        <Text style={styles.title}>Notes</Text>
        <Text>Actual Turns: _______________</Text>
        <Text>Resistance Measurements: _______________</Text>
        <Text>Test Results: _______________</Text>
        <Text>Inspector: _______________  Date: _______________</Text>
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