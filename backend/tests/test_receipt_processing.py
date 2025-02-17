import pytest
from .app import extract_items_from_text

def test_basic_item_extraction():
    sample_text = """
    STORE NAME
    123 MAIN ST
    
    Coffee      $3.99
    Bagel       $2.50
    Cookie      $1.99
    
    SUBTOTAL    $8.48
    TAX         $0.52
    TOTAL       $9.00
    """
    
    items = extract_items_from_text(sample_text)
    assert len(items) == 3
    assert items[0] == {"description": "Coffee", "price": 3.99}
    assert items[1] == {"description": "Bagel", "price": 2.50}
    assert items[2] == {"description": "Cookie", "price": 1.99}

def test_handles_empty_text():
    items = extract_items_from_text("")
    assert items == []

def test_ignores_totals():
    sample_text = """
    TOTAL       $15.00
    SUBTOTAL    $13.00
    TAX         $2.00
    """
    items = extract_items_from_text(sample_text)
    assert items == []

def test_handles_complex_prices():
    sample_text = """
    Large Pizza    $12.99
    Extra Cheese    $1.50
    2x Soda @ $1.99 ea
    """
    items = extract_items_from_text(sample_text)
    assert len(items) == 2
    assert items[0] == {"description": "Large Pizza", "price": 12.99}
    assert items[1] == {"description": "Extra Cheese", "price": 1.50} 