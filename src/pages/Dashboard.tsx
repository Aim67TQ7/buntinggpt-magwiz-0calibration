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
      
      // First get all quotes to determine which quote items we need
      const quotesResponse = await supabase.from('BMR_quotes').select('*').order('id', { ascending: true });
      
      if (quotesResponse.error) {
        console.error('Quotes query error:', quotesResponse.error);
        throw quotesResponse.error;
      }

      const quotes = quotesResponse.data as Quote[];
      const quoteIds = quotes.map(q => q.id);
      
      console.log('Found quotes:', quotes.length, 'Quote IDs:', quoteIds);

      // Get quote items for all our quotes (with explicit count to ensure we get all data)
      const quoteItemsResponse = await supabase
        .from('BMR_quote_items')
        .select('*', { count: 'exact' })
        .in('quote_id', quoteIds)
        .order('quote_id', { ascending: true });

      // Get other data
      const [productsResponse, bomItemsResponse] = await Promise.all([
        supabase.from('BMR_products').select('*'),
        supabase.from('BMR_parts').select('*')
      ]);

      if (quoteItemsResponse.error) {
        console.error('Quote items query error:', quoteItemsResponse.error);
        throw quoteItemsResponse.error;
      }
      if (productsResponse.error) {
        console.error('Products query error:', productsResponse.error);
        throw productsResponse.error;
      }
      if (bomItemsResponse.error) {
        console.error('BOM items query error:', bomItemsResponse.error);
        throw bomItemsResponse.error;
      }

      const quoteItems = quoteItemsResponse.data as QuoteItem[];
      
      console.log('Loaded quote items:', quoteItems.length, 'Expected total count:', quoteItemsResponse.count);
      console.log('Quote items by quote_id:', quoteItems.reduce((acc, item) => {
        acc[item.quote_id] = (acc[item.quote_id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>));
      
      // Validate that we have items for our quotes
      const itemsByQuote = quoteItems.reduce((acc, item) => {
        acc[item.quote_id] = (acc[item.quote_id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      quoteIds.forEach(quoteId => {
        const itemCount = itemsByQuote[quoteId] || 0;
        console.log(`Quote ${quoteId}: ${itemCount} items`);
      });
      
      // Type-safe assignments with fallbacks
      setQuotes(quotes || []);
      setQuoteItems(quoteItems || []);
      setProducts((productsResponse.data as Product[]) || []);
      setBomItems((bomItemsResponse.data as BOMItem[]) || []);
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
      .reduce((total, item) => {
        // Only add to total if cost is positive (some items have -1 or null cost)
        const cost = item.cost > 0 ? item.cost : 0;
        return total + (cost * item.amount);
      }, 0);
  };

  const getSelectedQuoteItems = () => {
    if (!selectedQuote) return [];
    console.log('Selected quote:', selectedQuote);
    console.log('All quote items count:', quoteItems.length);
    console.log('Quote items sample:', quoteItems.slice(0, 3));
    
    // Ensure we're comparing the right data types - convert both to numbers
    const filteredItems = quoteItems.filter(item => {
      const itemQuoteId = Number(item.quote_id);
      const selectedQuoteId = Number(selectedQuote.id);
      console.log(`Comparing item.quote_id ${itemQuoteId} with selectedQuote.id ${selectedQuoteId}`);
      return itemQuoteId === selectedQuoteId;
    });
    
    console.log(`Filtered ${filteredItems.length} items for quote ${selectedQuote.id}:`, filteredItems);
    return filteredItems;
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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quotes / Workups</CardTitle>
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
                          <div className="font-medium text-base">
                            Quote {quote.id}
                            {quote.quote_number && (
                              <span className="ml-2 text-sm font-normal text-muted-foreground">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
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
                {getSelectedQuoteItems().length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No BOM items found for Quote {selectedQuote.id}</p>
                    <p className="text-sm mt-2">
                      Total quote items in database: {quoteItems.length}
                    </p>
                    <p className="text-sm">
                      Quote items for this quote ID: {quoteItems.filter(item => Number(item.quote_id) === Number(selectedQuote.id)).length}
                    </p>
                  </div>
                ) : (
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
                            {item.cost > 0 ? `$${(item.cost * item.amount).toFixed(2)}` : 'TBD'}
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