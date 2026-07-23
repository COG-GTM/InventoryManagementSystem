# InventoryManagementSystem
![mainscreen](https://user-images.githubusercontent.com/50165092/211186383-74f52037-1953-4a6c-b4e4-11edb63c6607.png)

## Modernized full-stack app

This repository also contains a modern web migration of the legacy C# WinForms Inventory Management System:

- **Backend** (`server/`): Express + TypeScript + SQLite REST API implementing `api-contract.md`
- **Frontend** (`web/`): Vite + TypeScript single-page app
- **E2E tests** (`e2e/`): Playwright end-to-end tests

See `api-contract.md` for the REST API contract and `modernization-plan.md` for the parallel modernization approach.

### Run locally

1. Start the backend:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   The API will be available at `http://localhost:3001`.

2. In another terminal, start the frontend:
   ```bash
   cd web
   npm install
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

The Vite dev server proxies `/api` requests to the backend automatically.

### Run tests

```bash
cd server && npm run test
cd web && npm test
cd e2e && npm run test
```

### Run with Docker

```bash
docker compose up --build
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:8081`

## Original project requirements

Below are project requirements.

I. User Interface
Create a C# application with a graphical user interface (GUI) based on the attached “GUI Mock-Up.” Write code to display each of the following forms in the GUI:

A.  A main form, showing the following controls:

•  buttons for “Add,” “Modify,” “Delete,” “Search” for parts and products, and “Exit”

•  lists for parts and products

• text boxes for searching for parts and products

•  title labels for parts, products, and the application title



B.  An add part form, showing the following controls:

•  radio buttons for “In-House” and “Outsourced” parts

•  buttons for “Save” and “Cancel”

•  text boxes for ID, name, inventory level, price, max and min values, and company name or machine ID

•  labels for ID, name, inventory level, price/cost, max and min values, the application title, and company name or machine ID



C.  A modify part form, with fields that populate with data from an existing Part, showing the following controls:

•  radio buttons for “In-House” and “Outsourced” parts

•  buttons for “Save” and “Cancel”

•  text boxes for ID, name, inventory level, price, max and min values, and company name or machine ID

•  labels for ID, name, inventory level, price, max and min values, the application title, and company name or machine ID



D .  An add product form, showing the following controls:

•  buttons for “Save,” “Cancel,” “Add” part, and “Delete” part

•  text boxes for ID, name, inventory level, price, and max and min values

•  labels for ID, name, inventory level, price, max and min values, and the application

•  a grid view for all parts

•  a grid view for parts associated with the product

•  a “Search” button and a text field with an associated list for displaying the results of the search



E.  A modify product form, with fields that populate with data from an existing product, showing the following controls:

•  buttons for “Save,” “Cancel,” “Add” part, and “Delete” part

•  text boxes for ID, name, inventory level, price, and max and min values

•  labels for ID, name, inventory level, price, max and min values, and the application “all candidate parts”

•  a grid view for parts associated with the product

•  a “Search” button and a text box with associated list for displaying the results of the search



II. Application



Now that you’ve created the GUI, write code to create the class structure provided in the attached “UML (unified modeling language) Class Diagram.” Enable each of the following capabilities in the application:



F.  Using the attached “UML Class Diagram,” create appropriate classes and instance variables with the following criteria:

•  five classes with the all associated properties

•  variables are accessible/modifiable through properties



G.  Add the following functionalities to the main form, using the methods provided in the attached “UML Class Diagram”:

•  redirect the user to the “Add Part,” “Modify Part,” “Add Product,” or “Modify Product” forms

•  delete a selected part or product from the grid view

•  search for a part or product and display matching results

•  exit the main form



H.  Add the following functionalities to the part forms, using the methods provided in the attached “UML Class Diagram”:

1.   “Add Part” form

•  select “In-House” or “Outsourced”

•  enter name, inventory level, price, max and min values, and company name or machine ID

•  save the data and then redirect to the main form

•  cancel or exit out of this form and go back to the main form

2.   “Modify Part” form

•  select “In-House” or “Outsourced”

•  modify or change data values

•  save modifications to the data and then redirect to the main form

•  cancel or exit out of this form and go back to the main form



I.  Add the following functionalities to the product forms, using the methods provided in the attached “UML Class Diagram”:

1.   “Add Product” form

•  enter name, inventory level, price, and max and min values

•  save the data and then redirect to the main form

•  associate one or more parts with a product

•  remove or disassociate a part from a product

•  cancel or exit out of this form and go back to the main form

2.   “Modify Product” form

•  modify or change data values

•  save modifications to the data and then redirect to the main form

•  associate one or more parts with a product

•  remove or disassociate a part from a product

•  cancel or exit out of this form and go back to the main form



J.  Write code to address the following conditions with exception handling code:

•  Detect non-numeric values in textboxes that expect numeric values

•  Min should be less than Max; and Inv should be between those two values

•  Prevent the user from deleting a product that has a Part associated with it

•  Confirm “Delete” actions

