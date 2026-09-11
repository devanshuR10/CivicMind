# Civic Grievance Training Dataset Documentation

## Dataset Overview
This dataset contains high-quality, diverse civic grievance text samples designed specifically for training local text classification machine learning models.

## Dataset Fields
- `text`: Citizen complaint description in English, Hinglish, or regional syntax.
- `department`: Target government department responsible for redressal.
- `category`: Civic category taxonomy.
- `subcategory`: Specific sub-issue descriptor.
- `priority`: Assigned urgency classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

## Department Taxonomy
1. **Water Department**: No water supply, pipeline leaks, low pressure, contaminated water.
2. **Public Works Department (PWD)**: Potholes, road damage, footpaths, bridge repair, incomplete construction.
3. **Electricity Department**: Power outages, transformer sparking, exposed live wires, low voltage.
4. **Sanitation Department**: Public toilets, sewage leak, public sanitation facilities.
5. **Municipal Drainage Department**: Stormwater drain overflow, waterlogging, clogged gutters.
6. **Electrical & Lighting Department**: Broken streetlights, dark streets, pole maintenance.
7. **Sanitation & Waste Department**: Uncollected garbage, open dumping, trash piles.
8. **Public Health Department**: Mosquito breeding, dengue vector control, pest hazards, stray animal nuisance.
9. **Municipal Transport Department**: Bus stop damage, broken traffic signals, public transport facilities.

## Adding New Training Data
To add new training samples, append rows to `grievance_dataset.csv` adhering to the column schema above, then execute:
```bash
python ml/train_model.py
```
