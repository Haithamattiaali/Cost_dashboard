# Cost Dashboard Visualization Requirements


---

## Executive Summary

This document provides comprehensive, audit-ready requirements for a Total Cost of Ownership (TCO) dashboard which represent the corner stone for dynamic data visualization based on excel file upload aiming to chive the outcomes of bussiness visualization requierment enlighten by the dashboard SDK that will provided . The dashboard all filtering abilities and visualizations either by charts or tables for all excel headder fields.



### Key Data Characteristics
- an excel sheet contain the following fields : 

1-Type : represent the type of expenses either general or employee 
2-year : represent the year for specific data range 
3-quarter : represent the quarter for specific data range 
3-warehouse : all the cost activity are for logistics that being provided from service points represented by warehouses , each warehouse will represent a start point for activity propagation for which the cost being calculated. 
4-GL Account No. : this represents the general ledger account and usually it represented by id and have value this value is breached down for cost items.
5-GL Account Name: represents the global account name 
6-GL Accounts Group : business intent representation to describe the gl
7-Cost Type: business intent representation to describe the cost type either direct or indirect
8-TCO Model Categories represent the main activities for over all costs 
9-Main Categories:business intent representation to describe the cost items categories 
10-OpEx /CapEx : represent the distribution of costs over expenditure either open or Capex. 
11-total insured cost : represents the total cost incurred per gl account it represents the gl account value . 
12-WH COST SHARE :mannually assigned breakdown percentage to calculate the WAREHOUSE share value from total gl account value 
13-TRS  COST SHARE :mannually assigned breakdown percentage to calculate the TRANSPORTATION share value from total gl account value 
14-WH COST VALUE:calculate the WAREHOUSE share value from total gl account value BASED ON mannually assigned breakdown percentage TWH COST SHARE
15-TRS COST VALUE :calculate the TRANSPORTATION share value from total gl account value BASED ON mannually assigned breakdown percentage TRS  COST SHARE
16-Dist. COST SHARE :manually assigned breakdown percentage to calculate the DISTRIBUTION share value from total gl account value 
17-Last Mile (TRS) COST SHARE :manually assigned breakdown percentage to calculate the LAST MILE share value from total gl account value 
18-Proceed 3PL (WH) COST SHARE:manually assigned breakdown percentage to calculate the Proceed 3PL (WH)share value from total gl account value 
19-Proceed 3PL (TRS) COST SHARE :manually assigned breakdown percentage to calculate the Proceed 3PL (TRS) share value from total gl account value 
20-PHs COST VALUE : REPRESENT THE PHARMACIES COSTS CALCULATED BY SUBSTRACTION OF (Dist. COST VALUE +Last Mile (TRS) COST value +Proceed 3PL (WH) COST value+Proceed 3PL (TRS) COST value) from total incured cost of specific gl account 
21-Dist. COST VALUE:calculate the DISTRIBUTION share value from total gl account value BASED ON mannually assigned breakdown percentage Dist. COST SHARE.
22-Last Mile (TRS) COST value:calculate the Last Mile (TRS) COST value from total gl account value BASED ON mannually assigned breakdown percentage Last Mile (TRS) COST SHARE.
23-Proceed 3PL (WH) COST value:calculate the Proceed 3PL (WH) COST COST value from total gl account value BASED ON mannually assigned breakdown percentage Proceed 3PL (WH) COST SHARE.
24-Proceed 3PL (TRS) COST value:calculate the Proceed 3PL (TRS) COST value from total gl account value BASED ON mannually assigned breakdown percentage Proceed 3PL (TRS) COST SHARE.
25- Proceed 3pl COST VALUE : this is the insured costs for proceed 3pl calculated by summing Proceed 3PL (WH) COST VALUE +PROCEED 3pl COST VALUE 
---

## 1. Business Objectives

Based on the data structure above , the following business objectives are requiered:

Follow the dashboard sdk+ adding compare mode and brand dna in the following folder to achieve the following : 

1- AS Auser I need to be able to be able to see the cost breakdown in two ways chart followed by table for any of header components . 
2-As a user I need to be able to select analysis period from to . 
3- as a user I need compare mode to be able to compare between two periods. 
4- as a user I need to be able to see cost breakdown for Bussiness divisions : distribution , last-mile , proceed 3pl (proceed 3pl trans , proceed 3pl wh), pharmacies 
5-as a user I need to be able to see cost breakdown  by quarter and very important for dashboard to have comparison feature between each quarter 
6-as a user I need to be able to see cost breakdown By bossiness units : warehouses , transportation with an ability to compare the same parameters (warehouses , transportation) alongside different periods either quarters or years this could be  head to head chart alongside difference analysis .
7-as a user I need to be able to see cost breakdown By by warehouse
8-as a user I need to be able to see cost breakdown By DMASCO (pharmacies ,distribution,last-mile ) ,PROCEED 3pl (proceed 3pl trans , proceed 3pl wh)
9-as a user I need to be able to see cost breakdown By TCO Model category. 





---

## 2. Data Sources
The primary data source will be an excel sheet 

