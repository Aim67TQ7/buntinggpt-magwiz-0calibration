import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

interface OCWSpecData {
  prefix: number;
  suffix: number;
  surface_gauss: number;
  force_factor: number;
  watts: number;
  width: number;
  frame: string;
  
  // Component data
  core_dimension?: string;
  core_mass?: number;
  winding_dimension?: string;
  winding_mass?: number;
  backbar_dimension?: string;
  backbar_mass?: number;
  core_backbar_dimension?: string;
  core_backbar_mass?: number;
  side_pole_dimension?: string;
  side_pole_mass?: number;
  sealing_plate_dimension?: string;
  sealing_plate_mass?: number;
  core_insulator_dimension?: string;
  core_insulator_mass?: number;
  conservator_dimension?: string;
  conservator_mass?: number;
  coolant_mass?: number;
  total_mass?: number;
  
  // Winding info
  number_of_sections?: number;
  radial_depth?: number;
  coil_height?: number;
  diameter?: number;
  mean_length_of_turn?: number;
  number_of_turns?: string;
  surface_area?: number;
  wires_in_parallel?: number;
  
  // Electrical properties
  voltage_A?: number;
  voltage_B?: number;
  voltage_C?: number;
  resistance_A?: number;
  resistance_B?: number;
  resistance_C?: number;
  watts_A?: number;
  watts_B?: number;
  watts_C?: number;
  cold_current_A?: number;
  cold_current_B?: number;
  cold_current_C?: number;
  hot_current_A?: number;
  hot_current_B?: number;
  hot_current_C?: number;
  cold_ampere_turns_A?: string;
  cold_ampere_turns_B?: string;
  cold_ampere_turns_C?: string;
  hot_ampere_turns_A?: number;
  hot_ampere_turns_B?: number;
  hot_ampere_turns_C?: number;
  ambient_temperature_A?: string;
  ambient_temperature_B?: string;
  ambient_temperature_C?: string;
  temperature_rise_A?: number;
  temperature_rise_B?: number;
  temperature_rise_C?: number;
  maximum_rise_A?: number;
  maximum_rise_B?: number;
  maximum_rise_C?: number;
  expected_rise_A?: number;
  expected_rise_B?: number;
  expected_rise_C?: number;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 10,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  column: {
    flex: 1,
  },
  leftColumn: {
    flex: 1,
    marginRight: 5,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 5,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    minHeight: 16,
    alignItems: 'center',
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 16,
    alignItems: 'center',
  },
  tableColHeader: {
    width: '25%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    backgroundColor: '#e0e0e0',
    padding: 2,
    fontWeight: 'bold',
    fontSize: 7,
  },
  tableCol: {
    width: '25%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderRightStyle: 'solid',
    padding: 2,
    fontSize: 7,
  },
  tableColLast: {
    width: '25%',
    padding: 2,
    fontSize: 7,
  },
  perfBox: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 4,
    marginBottom: 4,
    flex: 1,
    minWidth: '18%',
  },
  perfLabel: {
    fontSize: 7,
    color: '#666',
    marginBottom: 2,
  },
  perfValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 7,
    color: '#666',
    width: '40%',
  },
  infoValue: {
    fontSize: 8,
    fontWeight: 'bold',
    width: '60%',
  },
  footer: {
    marginTop: 10,
    fontSize: 7,
    textAlign: 'center',
    color: '#666',
  },
});

interface OCWSpecificationsPDFProps {
  data: OCWSpecData;
}

const OCWSpecificationsPDF: React.FC<OCWSpecificationsPDFProps> = ({ data }) => {
  const componentData = [
    { name: "Core", material: "Mild Steel", dimension: data.core_dimension, mass: data.core_mass },
    { name: "Winding", material: "Aluminium Nomex", dimension: data.winding_dimension, mass: data.winding_mass },
    { name: "Backbar", material: "Mild Steel", dimension: data.backbar_dimension, mass: data.backbar_mass },
    { name: "Core Backbar", material: "Mild Steel", dimension: data.core_backbar_dimension, mass: data.core_backbar_mass },
    { name: "Side Pole (4x)", material: "Mild Steel", dimension: data.side_pole_dimension, mass: data.side_pole_mass },
    { name: "Sealing Plate", material: "Manganese Steel", dimension: data.sealing_plate_dimension, mass: data.sealing_plate_mass ? parseFloat(data.sealing_plate_mass.toString()) : undefined },
    { name: "Core Insulator", material: "Elephantide", dimension: data.core_insulator_dimension, mass: data.core_insulator_mass ? parseFloat(data.core_insulator_mass.toString()) : undefined },
    { name: "Conservator", material: "Mild Steel", dimension: data.conservator_dimension, mass: data.conservator_mass },
    { name: "Coolant (Oil)", material: "Oil", dimension: "-", mass: data.coolant_mass },
  ].filter(item => item.mass !== undefined && item.mass !== null);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>
          OVERHEAD CONVEYOR MAGNET SPECIFICATIONS
        </Text>
        <Text style={styles.subheader}>
          Model: {data.prefix} OCW {data.suffix} | Date: {new Date().toLocaleDateString('en-US')}
        </Text>

        {/* Performance Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERFORMANCE SPECIFICATIONS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={styles.perfBox}>
              <Text style={styles.perfLabel}>Surface Gauss</Text>
              <Text style={styles.perfValue}>{data.surface_gauss}</Text>
            </View>
            <View style={styles.perfBox}>
              <Text style={styles.perfLabel}>Force Factor</Text>
              <Text style={styles.perfValue}>{data.force_factor?.toLocaleString()}</Text>
            </View>
            <View style={styles.perfBox}>
              <Text style={styles.perfLabel}>Watts</Text>
              <Text style={styles.perfValue}>{data.watts}</Text>
            </View>
            <View style={styles.perfBox}>
              <Text style={styles.perfLabel}>Width (mm)</Text>
              <Text style={styles.perfValue}>{data.width}</Text>
            </View>
            <View style={styles.perfBox}>
              <Text style={styles.perfLabel}>Frame</Text>
              <Text style={styles.perfValue}>{data.frame}</Text>
            </View>
          </View>
        </View>

        {/* Two Column Layout for Components and Winding */}
        <View style={styles.row}>
          {/* Component Breakdown */}
          <View style={styles.leftColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>COMPONENT BREAKDOWN</Text>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableColHeader, { width: '40%' }]}>Component</Text>
                  <Text style={[styles.tableColHeader, { width: '30%' }]}>Material</Text>
                  <Text style={[styles.tableColHeader, { width: '30%' }]}>Mass (kg)</Text>
                </View>
                {componentData.map((item, index) => {
                  const isLast = index === componentData.length - 1;
                  const RowStyle = isLast ? styles.tableRowLast : styles.tableRow;
                  return (
                    <View key={index} style={RowStyle}>
                      <Text style={[styles.tableCol, { width: '40%' }]}>{item.name}</Text>
                      <Text style={[styles.tableCol, { width: '30%' }]}>{item.material}</Text>
                      <Text style={[isLast ? styles.tableColLast : styles.tableCol, { width: '30%' }]}>
                        {item.mass?.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Total Mass:</Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{data.total_mass?.toFixed(2)} kg</Text>
              </View>
            </View>
          </View>

          {/* Winding Information */}
          <View style={styles.rightColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>WINDING INFORMATION</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sections:</Text>
                <Text style={styles.infoValue}>{data.number_of_sections}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Radial Depth:</Text>
                <Text style={styles.infoValue}>{data.radial_depth} mm</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Coil Height:</Text>
                <Text style={styles.infoValue}>{data.coil_height?.toFixed(2)} mm</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Diameter:</Text>
                <Text style={styles.infoValue}>{data.diameter?.toFixed(2)} mm</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mean Length/Turn:</Text>
                <Text style={styles.infoValue}>{data.mean_length_of_turn?.toFixed(2)} mm</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Number of Turns:</Text>
                <Text style={styles.infoValue}>{data.number_of_turns}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Surface Area:</Text>
                <Text style={styles.infoValue}>{data.surface_area?.toFixed(2)} m²</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Wires in Parallel:</Text>
                <Text style={styles.infoValue}>{data.wires_in_parallel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Electrical Properties Table - Full Width */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ELECTRICAL PROPERTIES (A20 / A30 / A40)</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Property</Text>
              <Text style={styles.tableColHeader}>A20</Text>
              <Text style={styles.tableColHeader}>A30</Text>
              <Text style={styles.tableColHeader}>A40</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Voltage (V)</Text>
              <Text style={styles.tableCol}>{data.voltage_A}</Text>
              <Text style={styles.tableCol}>{data.voltage_B?.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{data.voltage_C?.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Resistance (Ω)</Text>
              <Text style={styles.tableCol}>{data.resistance_A?.toFixed(4)}</Text>
              <Text style={styles.tableCol}>{data.resistance_B?.toFixed(4)}</Text>
              <Text style={styles.tableCol}>{data.resistance_C?.toFixed(4)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Watts (W)</Text>
              <Text style={styles.tableCol}>{data.watts_A}</Text>
              <Text style={styles.tableCol}>{data.watts_B}</Text>
              <Text style={styles.tableCol}>{data.watts_C}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Cold Current (A)</Text>
              <Text style={styles.tableCol}>{data.cold_current_A?.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{data.cold_current_B?.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{data.cold_current_C?.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Hot Current (A)</Text>
              <Text style={styles.tableCol}>{data.hot_current_A?.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{data.hot_current_B?.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{data.hot_current_C?.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Cold AT</Text>
              <Text style={styles.tableCol}>{data.cold_ampere_turns_A}</Text>
              <Text style={styles.tableCol}>{data.cold_ampere_turns_B}</Text>
              <Text style={styles.tableCol}>{data.cold_ampere_turns_C}</Text>
            </View>
            <View style={styles.tableRowLast}>
              <Text style={styles.tableCol}>Hot AT</Text>
              <Text style={styles.tableCol}>{data.hot_ampere_turns_A}</Text>
              <Text style={styles.tableCol}>{data.hot_ampere_turns_B}</Text>
              <Text style={styles.tableColLast}>{data.hot_ampere_turns_C}</Text>
            </View>
          </View>
        </View>

        {/* Temperature Data Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEMPERATURE DATA</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColHeader}>Property</Text>
              <Text style={styles.tableColHeader}>A20</Text>
              <Text style={styles.tableColHeader}>A30</Text>
              <Text style={styles.tableColHeader}>A40</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Ambient (°C)</Text>
              <Text style={styles.tableCol}>{data.ambient_temperature_A}</Text>
              <Text style={styles.tableCol}>{data.ambient_temperature_B}</Text>
              <Text style={styles.tableCol}>{data.ambient_temperature_C}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Rise (°C)</Text>
              <Text style={styles.tableCol}>{data.temperature_rise_A}</Text>
              <Text style={styles.tableCol}>{data.temperature_rise_B}</Text>
              <Text style={styles.tableCol}>{data.temperature_rise_C}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Maximum (°C)</Text>
              <Text style={styles.tableCol}>{data.maximum_rise_A}</Text>
              <Text style={styles.tableCol}>{data.maximum_rise_B}</Text>
              <Text style={styles.tableCol}>{data.maximum_rise_C}</Text>
            </View>
            <View style={styles.tableRowLast}>
              <Text style={styles.tableCol}>Expected (°C)</Text>
              <Text style={styles.tableCol}>{data.expected_rise_A?.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{data.expected_rise_B?.toFixed(2)}</Text>
              <Text style={styles.tableColLast}>{data.expected_rise_C?.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated from OCW Configuration Database | Bunting Magnetics Co.
        </Text>
      </Page>
    </Document>
  );
};

export const downloadOCWSpecifications = async (data: OCWSpecData) => {
  const blob = await pdf(<OCWSpecificationsPDF data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.download = `OCW_Specs_${data.prefix}_${data.suffix}_${dateStr}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default OCWSpecificationsPDF;
