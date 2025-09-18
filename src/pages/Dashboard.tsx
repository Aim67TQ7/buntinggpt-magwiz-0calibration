import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, DollarSign, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Quote {
  id: number;
  quote_number: string;
  product_id: number;
  date_generated: number;
  verified: string;
  date_verified: string;
}

interface QuoteItem {
  "# item_id": number;
  quote_id: number;
  amount: number;
  weight: number | null;
  cost: number;
  name: string;
}

type DatabaseQuoteItem = {
  "# item_id": number;
  quote_id: number;
  amount: number;
  weight: number | null;
  cost: number;
  name: string;
};

interface Product {
  id: number;
  name: string;
}

interface BOMItem {
  id: number;
  bom: number;
  material: number;
  amount: number;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from database
      const [quotesResponse, quoteItemsResponse, productsResponse, bomItemsResponse] = await Promise.all([
        supabase.from('BMR_quotes').select('*'),
        supabase.from('BMR_quote_items').select('*'),
        supabase.from('BMR_products').select('*'),
        supabase.from('BMR_parts').select('*')
      ]);

      if (quotesResponse.error) throw quotesResponse.error;
      if (quoteItemsResponse.error) throw quoteItemsResponse.error;
      if (productsResponse.error) throw productsResponse.error;
      if (bomItemsResponse.error) throw bomItemsResponse.error;

      setQuotes(quotesResponse.data || []);
      setQuoteItems(quoteItemsResponse.data || []);
      setProducts(productsResponse.data || []);
      setBomItems(bomItemsResponse.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.name || `Product ${productId}`;
  };

  const getQuoteTotal = (quoteId: number) => {
    return quoteItems
      .filter(item => item.quote_id === quoteId)
      .reduce((total, item) => total + (item.cost * item.amount), 0);
  };

  const getSelectedQuoteItems = () => {
    if (!selectedQuote) return [];
    return quoteItems.filter(item => item.quote_id === selectedQuote.id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Calculator
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">BMR Quotes Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Left side - Quotes List (25%) */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quotes / Workups</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <Table>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow 
                      key={quote.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedQuote?.id === quote.id ? 'bg-muted' : ''}`}
                      onClick={() => setSelectedQuote(quote)}
                    >
                      <TableCell className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {quote.quote_number || `MW${quote.id}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getProductName(quote.product_id)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(quote.date_generated)}
                          </div>
                          {quote.verified === "1" && (
                            <Badge variant="default" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right side - BOM Details (75%) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>
              {selectedQuote ? (
                <div className="flex items-center justify-between">
                  <span>{selectedQuote.quote_number || `MW${selectedQuote.id}`}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal">{getProductName(selectedQuote.product_id)}</span>
                    {selectedQuote.verified === "1" && (
                      <Badge variant="default">Verified</Badge>
                    )}
                  </div>
                </div>
              ) : (
                "Select a quote to view BOM details"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedQuote ? (
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSelectedQuoteItems().map((item) => (
                      <TableRow key={item["# item_id"]}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.amount}</TableCell>
                        <TableCell className="text-right">
                          {item.weight ? `${item.weight.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.cost > 0 ? `$${(item.cost * item.amount).toFixed(2)}` : 'Unknown'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-semibold">
                      <TableCell colSpan={3} className="text-right">Total</TableCell>
                      <TableCell className="text-right">
                        ${getQuoteTotal(selectedQuote.id).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Click on a quote from the left to view its BOM details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;