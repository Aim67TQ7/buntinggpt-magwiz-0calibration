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
  const [loadingQuoteItems, setLoadingQuoteItems] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch quotes, products, and BOM items (but not all quote items)
      const [quotesResponse, productsResponse, bomItemsResponse] = await Promise.all([
        supabase.from('BMR_quotes').select('*').order('date_generated', { ascending: false }),
        supabase.from('BMR_products').select('*'),
        supabase.from('BMR_parts').select('*')
      ]);

      if (quotesResponse.error) throw quotesResponse.error;
      if (productsResponse.error) throw productsResponse.error;
      if (bomItemsResponse.error) throw bomItemsResponse.error;

      const quotes = quotesResponse.data as Quote[];
      console.log('Found quotes:', quotes.length);
      
      setQuotes(quotes || []);
      setProducts((productsResponse.data as Product[]) || []);
      setBomItems((bomItemsResponse.data as BOMItem[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteItems = async (quoteId: number) => {
    try {
      setLoadingQuoteItems(true);
      console.log('Fetching items for quote:', quoteId);
      
      const response = await supabase
        .from('BMR_quote_items')
        .select('*', { count: 'exact' })
        .eq('quote_id', quoteId)
        .order('name', { ascending: true });

      if (response.error) {
        console.error('Quote items query error:', response.error);
        throw response.error;
      }

      const items = response.data as QuoteItem[];
      console.log(`Loaded ${items.length} items for quote ${quoteId}:`, items);
      
      setQuoteItems(items || []);
    } catch (error) {
      console.error('Error fetching quote items:', error);
      setQuoteItems([]);
    } finally {
      setLoadingQuoteItems(false);
    }
  };

  const handleQuoteSelection = (quote: Quote) => {
    setSelectedQuote(quote);
    fetchQuoteItems(quote.id);
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.name || `Product ${productId}`;
  };

  const getQuoteTotal = (quoteId: number) => {
    return quoteItems
      .filter(item => item.quote_id === quoteId)
      .reduce((total, item) => {
        if (item.cost <= 0) return total;
        
        // For coolant and labor items, use cost directly from database
        const isLaborOrCoolant = item.name.toLowerCase().includes('coolant') || 
                                item.name.toLowerCase().includes('labour') || 
                                item.name.toLowerCase().includes('labor');
        
        const itemTotal = isLaborOrCoolant ? item.cost : (item.cost * item.amount);
        return total + itemTotal;
      }, 0);
  };

  const getItemDisplayCost = (item: QuoteItem) => {
    if (item.cost <= 0) return 'TBD';
    
    // For coolant and labor items, use cost directly from database
    const isLaborOrCoolant = item.name.toLowerCase().includes('coolant') || 
                            item.name.toLowerCase().includes('labour') || 
                            item.name.toLowerCase().includes('labor');
    
    const displayCost = isLaborOrCoolant ? item.cost : (item.cost * item.amount);
    return `$${displayCost.toFixed(2)}`;
  };

  const getSelectedQuoteItems = () => {
    if (!selectedQuote) return [];
    return quoteItems;
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
          <h1 className="text-2xl font-bold">Quote History</h1>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Left side - Quotes List (25%) */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quotes / Workups</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <Table>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow 
                      key={quote.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedQuote?.id === quote.id ? 'bg-muted' : ''}`}
                      onClick={() => handleQuoteSelection(quote)}
                    >
                       <TableCell className="p-4">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            Quote {quote.id}
                            {quote.quote_number && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                ({quote.quote_number})
                              </span>
                            )}
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedQuote ? (
                <div className="flex items-center justify-between">
                  <span>BOM Items for Quote {selectedQuote.id}{selectedQuote.quote_number && ` (${selectedQuote.quote_number})`}</span>
                  <div className="flex items-center gap-2">
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
                {loadingQuoteItems ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading BOM items for Quote {selectedQuote.id}...
                  </div>
                ) : getSelectedQuoteItems().length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No BOM items found for Quote {selectedQuote.id}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm">Item</TableHead>
                        <TableHead className="text-right text-sm">Quantity</TableHead>
                        <TableHead className="text-right text-sm">Weight</TableHead>
                        <TableHead className="text-right text-sm">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSelectedQuoteItems().map((item) => (
                        <TableRow key={item["# item_id"]}>
                          <TableCell className="font-medium text-sm">{item.name}</TableCell>
                          <TableCell className="text-right text-sm">{item.amount}</TableCell>
                          <TableCell className="text-right text-sm">
                            {item.weight ? `${item.weight.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {getItemDisplayCost(item)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 font-semibold">
                        <TableCell colSpan={3} className="text-right text-sm">Total</TableCell>
                        <TableCell className="text-right text-sm">
                          ${getQuoteTotal(selectedQuote.id).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
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