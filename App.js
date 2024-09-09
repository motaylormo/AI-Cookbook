import React, { useState } from 'react'
import OpenAI from "openai";
import { marked } from 'marked';
/* Ant Design */
import { Form, Input, Select, Checkbox, Radio, Col, Row, Button, Space, ConfigProvider } from 'antd';

const openai = new OpenAI({
  apiKey: /** fill in key **/,
  dangerouslyAllowBrowser: true
});

let sidebarData = {
  units: null,
  restrictions1: null, restrictions2: null,
  allergies: null
}

const color = {
  space: "#222E50",
  cerulean: "#007991",
  zomp: "#439A86",
  celadon: "#BCD8C1",
  flax: "#E9D985"
};
const theme = {
  token: {
    colorBgContainer: color["cerulean"],
    colorText: color["flax"],
    colorTextSecondary: color["space"],
    colorPrimary: color["space"],
    colorFillTertiary: color["flax"],
  }
};

const dietaryRestrictions = {
  animal: ["pescetarian", "vegetarian", "vegan"],
  religious: ["halal", "kosher"],
  medical: ["diabetic", "gluten free", "heart healthy"]
};
const allergyOptions = [
  "dairy",
  "eggs",
  "fish",
  "shellfish",
  "tree nuts",
  "peanuts",
  "wheat",
  "soy"
];

async function openaiStuff(dict, setLoading) {
  const completion = await openai.chat.completions.create({
    messages: [
      { "role": "user", "content": assemblePromptStr(dict) }
    ],
    model: "gpt-3.5-turbo",
  });
  displayRecipe(completion.choices[0]['message']['content']);
  setLoading(false)
}

function assemblePromptStr(dict) {
  let str = "Write receipe for " + dict.prompt + '. ';
  if (dict.include) {
    str += "Must include " + dict.include.join(' and ') + '. ';
  }
  dict.restrictions = [dict.animal, dict.religious, dict.medical]
        .flat().filter(item => item)
  if (dict.restrictions.length > 0) {
    str += "Must be " + dict.restrictions.join(' and ') + '. ';
  }
  dict.exclude = [dict.allergies, dict.exclude]
        .flat().filter(item => item)
  if (dict.exclude.length > 0) {
    str += "Must not include " + dict.exclude.join(' or ') + '. ';
  }
  if (dict.units) {
    str += "Give recipe in " + dict.units + ' units. ';
  }
  console.log(str);
  return str;
}

function displayRecipe(recipe) {
  var recipeBlock = document.createElement("div");
  recipeBlock.classList.add("recipe");
  recipeBlock.innerHTML = marked.parse(recipe);
  document.getElementById("chatbox").prepend(recipeBlock);
}

const onFinish = (values) => {
  console.log("Received values of form: ", values);
};

const onValuesChange = (changedValues, allValues) => {
  sidebarData = allValues
};

function App() {
  const [loading, setLoading] = useState(false);

  const onSubmitPrompt = (values) => {
    if (values["prompt"] == null) { return }
    setLoading(true);
    let mergedData = {...values, ...sidebarData}
    //console.log("merged", mergedData)
    openaiStuff(mergedData, setLoading)
  };

  return (
    <>
      <ConfigProvider theme={theme}>
        <div className="container">
          <div className="sidebar" id="sidebar">
            <Form
              onFinish={onFinish}
              onValuesChange={onValuesChange}
              layout="vertical"
              initialValues={{
                units: "imperial",
                exclusions: [""],
                inclusions: [""]
              }}
            >
              <Form.Item label="Give recipe in" name="units">
                <Radio.Group buttonStyle="solid">
                  <Radio.Button value="metric">metric</Radio.Button>
                  <Radio.Button value="imperial">imperial</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <h2>Exclude</h2>
              <Form.Item label="Dietary restrictions">
                <Row>
                  <Col span={12} align="left">
                    <Form.Item name="animal" noStyle>
                      <Radio.Group options={dietaryRestrictions.animal} />
                    </Form.Item>
                  </Col>
                  <Col span={12} align="right">
                    <Form.Item name="religious" noStyle>
                      <Checkbox.Group options={dietaryRestrictions.religious} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item name="medical">
                <Checkbox.Group options={dietaryRestrictions.medical} />
              </Form.Item>

              <Form.Item name="allergies" label="Allergies">
                <Checkbox.Group options={allergyOptions} />
              </Form.Item>

              <Form.Item name="exclude" label="Additional restrictions">
                <Select
                  mode="tags"
                  variant="filled"
                  dropdownStyle={{ display: 'none' }}
                  suffixIcon={null}
                  style={{ width: '100%' }}
                  placeholder="do not include..."></Select>
              </Form.Item>
            </Form>
          </div>
          <div className="main-body">
            <div id="chatbox"></div>
          </div>
        </div>
        <div className="footer" id="footer">
          <Form onFinish={onSubmitPrompt} layout="horizontal">
            <Row>
              <Col span={10} align="left">
                <Form.Item name="include"
                  label={<label style={{ color: "var(--space)" }}>Must include:</label>}
                  style={{ marginBottom: "0px" }}
                >
                  <Select
                    mode="tags"
                    variant="filled"
                    dropdownStyle={{ display: 'none' }}
                    suffixIcon={null}
                    style={{ width: '100%' }}
                    placeholder="ingredients to include"></Select>
                </Form.Item>
              </Col>
              <Col span={14} align="right">
                <Space.Compact block>
                  <Form.Item name="prompt" noStyle>
                    <Input placeholder="recipe prompt" allowClear />
                  </Form.Item>
                  <Form.Item noStyle>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Submit
                    </Button>
                  </Form.Item>
                </Space.Compact>
              </Col>
            </Row>
          </Form>
        </div>
      </ConfigProvider>
    </>
  )
}

export default App
