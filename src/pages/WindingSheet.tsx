import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { downloadOCWWindingSheet } from '@/components/OCWWindingSheetPDF';

const WindingSheet = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parse the data from URL parameters
  const prefix = searchParams.get('prefix');
  const suffix = searchParams.get('suffix');
  const data = searchParams.get('data');
  
  let selectedRecord = null;
  if (data) {
    try {
      selectedRecord = JSON.parse(decodeURIComponent(data));
    } catch (error) {
      console.error('Error parsing data:', error);
    }
  }

  if (!selectedRecord) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No data found</h1>
          <Button onClick={() => navigate('/ocw')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to OCW
          </Button>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    downloadOCWWindingSheet(selectedRecord);
  };

  const today = new Date().toLocaleDateString('en-GB');

  return (
    <div className="container mx-auto p-2 max-w-4xl">
      <div className="mb-2 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate(`/ocw?prefix=${prefix}&suffix=${suffix}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to OCW
        </Button>
        <Button onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <Card className="print:shadow-none">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl">
            Winding Sheet for {prefix || 'N/A'} OCW {suffix || 'N/A'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{today}</p>
        </CardHeader>
        
        <CardContent className="p-3">
          {/* Top Section - Conductor Information */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Left Column */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1 text-sm">
                <div className="font-medium border p-1 bg-muted">Conductor Material</div>
                <div className="border p-1">{selectedRecord.winding_dimension || 'Aluminium'}</div>
                
                <div className="font-medium border p-1 bg-muted">Conductor Insulation</div>
                <div className="border p-1">Nomex</div>
                
                <div className="font-medium border p-1 bg-muted">No. of Coils</div>
                <div className="border p-1">1</div>
                
                <div className="font-medium border p-1 bg-muted">Wires in Parallel</div>
                <div className="border p-1">{selectedRecord.wires_in_parallel || 'N/A'}</div>
              </div>

              {/* Electrical Values */}
              <div className="grid grid-cols-4 gap-0 text-sm">
                <div className="font-medium border p-1 bg-muted">Volts</div>
                <div className="font-medium border p-1 bg-muted">Amps</div>
                <div className="font-medium border p-1 bg-muted">Ohms</div>
                <div className="font-medium border p-1 bg-muted">Per Coil</div>
                
                <div className="border p-1">{selectedRecord.voltage_A || 'N/A'}</div>
                <div className="border p-1">{selectedRecord.cold_current_A?.toFixed(2) || 'N/A'}</div>
                <div className="border p-1">{selectedRecord.resistance_A?.toFixed(4) || 'N/A'}</div>
                <div className="border p-1"></div>
                
                <div className="border p-1"></div>
                <div className="border p-1"></div>
                <div className="border p-1"></div>
                <div className="font-medium border p-1 bg-muted">Total</div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1 text-sm">
                <div className="font-medium border p-1 bg-muted">Size</div>
                <div className="border p-1">{selectedRecord.diameter || 'N/A'}</div>
                
                <div className="font-medium border p-1 bg-muted">Weight</div>
                <div className="border p-1">{selectedRecord.winding_mass || 'N/A'}</div>
                
                <div className="font-medium border p-1 bg-muted">Number of Turns</div>
                <div className="border p-1">{selectedRecord.number_of_turns || 'N/A'}</div>
                
                <div className="font-medium border p-1 bg-muted">Wound on Core</div>
                <div className="border p-1">Yes</div>
              </div>
            </div>
          </div>

          {/* Test Section */}
          <div className="mb-4">
            <h3 className="text-center font-medium mb-2 text-sm">
              Test - Continuous 8 hours minimum or until current remains constant for 3 hours
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* First Table */}
              <div>
                <div className="grid grid-cols-5 gap-0 text-xs">
                  <div className="font-medium border p-1 bg-muted text-center">Time</div>
                  <div className="font-medium border p-1 bg-muted text-center">Hrs</div>
                  <div className="font-medium border p-1 bg-muted text-center">Volts</div>
                  <div className="font-medium border p-1 bg-muted text-center">Amps</div>
                  <div className="font-medium border p-1 bg-muted text-center">Amb °C</div>
                  
                  {[0, 1, 2, 3, 4, 5].map((hour) => (
                    <React.Fragment key={hour}>
                      <div className="border p-1 h-6"></div>
                      <div className="border p-1 h-6 text-center">{hour}</div>
                      <div className="border p-1 h-6"></div>
                      <div className="border p-1 h-6"></div>
                      <div className="border p-1 h-6"></div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Second Table */}
              <div>
                <div className="grid grid-cols-5 gap-0 text-xs">
                  <div className="font-medium border p-1 bg-muted text-center">Time</div>
                  <div className="font-medium border p-1 bg-muted text-center">Hrs</div>
                  <div className="font-medium border p-1 bg-muted text-center">Volts</div>
                  <div className="font-medium border p-1 bg-muted text-center">Amps</div>
                  <div className="font-medium border p-1 bg-muted text-center">Amb °C</div>
                  
                  {[6, 7, 8, 9, 10, 11].map((hour) => (
                    <React.Fragment key={hour}>
                      <div className="border p-1 h-6"></div>
                      <div className="border p-1 h-6 text-center">{hour}</div>
                      <div className="border p-1 h-6"></div>
                      <div className="border p-1 h-6"></div>
                      <div className="border p-1 h-6"></div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Test Results and Information */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div className="font-medium border p-1 bg-muted">Actual Turns</div>
              <div className="border p-1 h-6"></div>
              
              <div className="font-medium border p-1 bg-muted">Prior to Test Resistance to Earth</div>
              <div className="border p-1">MΩ</div>
              
              <div className="font-medium border p-1 bg-muted">After Test Resistance to Earth</div>
              <div className="border p-1">MΩ</div>
              
              <div className="font-medium border p-1 bg-muted">Temperature Rise by Resistance</div>
              <div className="border p-1">°C</div>
              
              <div className="font-medium border p-1 bg-muted">Insulation Type</div>
              <div className="border p-1">Class</div>
              
              <div className="font-medium border p-1 bg-muted">Passed by Works</div>
              <div className="border p-1">Date</div>
              
              <div className="font-medium border p-1 bg-muted">Checked & Passed by Office</div>
              <div className="border p-1">Date</div>
              
              <div className="font-medium border p-1 bg-muted">Gauss Test</div>
              <div className="border p-1">Yes/No</div>
              
              <div className="font-medium border p-1 bg-muted">Unit Weight</div>
              <div className="border p-1">Kgs</div>
              
              <div className="font-medium border p-1 bg-muted">Winding Hours</div>
              <div className="border p-1 h-6"></div>
              
              <div className="font-medium border p-1 bg-muted">Nomex Used</div>
              <div className="border p-1">M</div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mt-3">
            <div className="font-medium text-sm mb-1">Special Instructions</div>
            <div className="border p-2 h-12 bg-background"></div>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-3">
            Generated from OCW Configuration Database - {selectedRecord.filename}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WindingSheet;