# Receipts Made Easy

Receipts Made Easy is a web application designed to help users upload receipts, extract relevant information, and categorize expenses. The application leverages Optical Character Recognition (OCR) to read text from images of receipts and classify items into predefined categories.

## Summary

This project was built using the following technologies:

- **Frontend**: Developed with Next.js, React, and TypeScript, styled using Tailwind CSS for a responsive design.
- **Backend**: Built with Flask and Python, utilizing the Google Cloud Vision API for OCR capabilities and Tesseract OCR for additional text extraction.
- **Item Classification**: Implemented a simple keyword-based classification system to categorize items into groups such as Food, Grocery, Clothing, Electronics, and more.

The application allows users to upload receipt images, processes them to extract data such as date, items, tax, and total, and displays the results in a user-friendly format. Users can also export the processed data to CSV for further analysis.

## How It Was Created

1. **Frontend Development**: The frontend was created using Next.js, which provides a powerful framework for building React applications. Tailwind CSS was used for styling, allowing for rapid UI development with utility-first classes.

2. **Backend Development**: The backend was developed using Flask, a lightweight web framework for Python. It handles file uploads, processes images using the Google Cloud Vision API, and extracts text using Tesseract OCR.

3. **Data Handling**: The application stores receipt data in memory for quick access and displays it in a structured format. Item classification is done using a predefined set of keywords to categorize expenses effectively.

This project serves as a practical tool for managing and analyzing personal expenses through receipt tracking.