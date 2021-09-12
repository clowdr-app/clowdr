CREATE  INDEX "content_Element_data_gin" on
  "content"."Element" using gin ("data");
