import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Define the exact order for BOM items
  const BOM_ITEM_ORDER = [
    'Core',
    'Winding',
    'Backbar',
    'Core Backbar',
    'Side Pole',
    'Sealing Plate',
    'Core Insulator',
    'Conservator',
    'Coolant',
    'Dowels and Spacers',
    'Steel Sections',
    'Pulleys',
    'Self Lube Bearings',
    'Geared Motor',
    'Mesh Guards',
    'Belt',
    'Terminal Box and Posts',
    'Odds Factor',
    'OCW Labour',
    'Overband Labour'
  ];

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
        .eq('quote_id', quoteId);

      if (response.error) {
        console.error('Quote items query error:', response.error);
        throw response.error;
      }

      const items = response.data as QuoteItem[];
      
      // Sort items according to predefined order
      const sortedItems = items.sort((a, b) => {
        const indexA = BOM_ITEM_ORDER.indexOf(a.name);
        const indexB = BOM_ITEM_ORDER.indexOf(b.name);
        
        // If both items are in the order list, sort by their position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // If only one item is in the list, it comes first
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // If neither is in the list, sort alphabetically
        return a.name.localeCompare(b.name);
      });
      
      console.log(`Loaded ${sortedItems.length} items for quote ${quoteId}:`, sortedItems);
      
      setQuoteItems(sortedItems || []);
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
    return new Date(timestamp * 1000).toLocaleDateString('en-GB');
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

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Left side - Collapsible Quotes List */}
        <Collapsible open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <Card className={`transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-12'}`}>
            <CardHeader className="pb-2 px-2 pt-2">
              <div className="flex items-center justify-between">
                {sidebarOpen && (
                  <CardTitle className="text-base">Quote History</CardTitle>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
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
                          <TableCell className="p-2">
                            <div className="text-xs font-mono whitespace-nowrap">
                              {quote.quote_number} {getProductName(quote.product_id)} {formatDate(quote.date_generated)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Right side - BOM Details */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedQuote ? (
                <div className="flex items-center justify-between">
                  <span>BOM Items for Quote {selectedQuote.id} - {getProductName(selectedQuote.product_id)}{selectedQuote.quote_number && ` (${selectedQuote.quote_number})`}</span>
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